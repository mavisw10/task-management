import axios from "axios";
import { STATUS } from "@/enum/status";

/**
 * Data layer with automatic fallback.
 *
 * - Development (or when VITE_API_URL is set): talks to the Express API in backend/.
 * - When the API is unreachable (e.g. the static build deployed on GitHub Pages),
 *   data is read from and written to the browser's localStorage instead,
 *   so the demo keeps working without a server.
 *
 * The chosen source is remembered for the current session after the first call.
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const STORAGE_KEY = "task-management.tasks";

// "api" | "local" | null (not decided yet)
let source = null;

const prefersApi = () =>
  Boolean(import.meta.env.VITE_API_URL) || import.meta.env.DEV;

// axios rejects with a network error (no response) when the server is unreachable
const isNetworkError = (error) => !error.response;

const isSet = (value) => value !== undefined && value !== null && value !== "";

const dayKey = (timestamp) => {
  const date = new Date(Number(timestamp));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

// ---------------------------------------------------------------------------
// Shared filter logic (mirrors the API's /get-task-list query semantics)
// ---------------------------------------------------------------------------
export function filterTasks(tasks, filters = {}) {
  const { taskName, status, priority, dueDate, createdOn } = filters;

  return tasks.filter((task) => {
    if (isSet(taskName)) {
      const keyword = String(taskName).toLowerCase();
      if (!String(task.taskName ?? "").toLowerCase().includes(keyword)) {
        return false;
      }
    }
    if (isSet(status) && Number(task.status) !== Number(status)) return false;
    if (isSet(priority) && Number(task.priority) !== Number(priority)) {
      return false;
    }
    if (isSet(dueDate) && Number(task.dueDate) !== Number(dueDate)) {
      return false;
    }
    if (isSet(createdOn) && dayKey(task.createdOn) !== dayKey(createdOn)) {
      return false;
    }
    return true;
  });
}

// ---------------------------------------------------------------------------
// localStorage store
// ---------------------------------------------------------------------------
const seedTasks = () => {
  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();

  return [
    {
      id: 1,
      taskName: "Design the landing page mockup",
      description: "Create desktop and mobile wireframes in Figma.",
      status: STATUS.IN_PROGRESS,
      priority: 1,
      createdOn: now - 5 * day,
      dueDate: now + 3 * day,
    },
    {
      id: 2,
      taskName: "Write project README",
      description: "Badges, screenshots, features and setup guide.",
      status: STATUS.PENDING,
      priority: 2,
      createdOn: now - 3 * day,
      dueDate: now + 7 * day,
    },
    {
      id: 3,
      taskName: "Review pull request #12",
      description: "Check the new filter implementation.",
      status: STATUS.WAITING_REVIEW,
      priority: 3,
      createdOn: now - 2 * day,
      dueDate: now + 1 * day,
    },
    {
      id: 4,
      taskName: "Set up CI pipeline",
      description: "Lint and test on every push.",
      status: STATUS.COMPLETED,
      priority: 2,
      createdOn: now - 10 * day,
      dueDate: now - 2 * day,
    },
  ];
};

const readLocal = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      const seeded = seedTasks();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) ?? [];
  } catch {
    return [];
  }
};

const writeLocal = (tasks) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};

const nextLocalId = (tasks) =>
  tasks.reduce((max, task) => Math.max(max, Number(task.id) || 0), 0) + 1;

// ---------------------------------------------------------------------------
// Source resolution
// ---------------------------------------------------------------------------
// Reads may downgrade to local storage if the API becomes unreachable.
async function read(runApi, runLocal) {
  if (source === "local") return runLocal();
  if (source === "api") {
    try {
      return await runApi();
    } catch (error) {
      if (!isNetworkError(error)) throw error;
      source = "local";
      return runLocal();
    }
  }
  if (!prefersApi()) {
    source = "local";
    return runLocal();
  }
  try {
    const result = await runApi();
    source = "api";
    return result;
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    source = "local";
    return runLocal();
  }
}

// Writes only fall back while the source is still undecided, so a write is
// never silently split across two stores.
async function write(runApi, runLocal) {
  if (source === "local") return runLocal();
  if (source === "api") return runApi();
  if (!prefersApi()) {
    source = "local";
    return runLocal();
  }
  try {
    const result = await runApi();
    source = "api";
    return result;
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    source = "local";
    return runLocal();
  }
}

const toApiParams = (filters = {}) => {
  const params = {};
  if (isSet(filters.taskName)) params.taskName = filters.taskName;
  if (isSet(filters.status)) params.status = filters.status;
  if (isSet(filters.priority)) params.priority = filters.priority;
  if (isSet(filters.dueDate)) params.dueDate = filters.dueDate;
  if (isSet(filters.createdOn)) params.createdOn = filters.createdOn;
  return params;
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export const listTasks = (filters) =>
  read(
    async () =>
      (
        await axios.get(`${API_URL}/get-task-list`, {
          params: toApiParams(filters),
        })
      ).data,
    async () => filterTasks(readLocal(), filters),
  );

export const createTask = (payload) =>
  write(
    async () =>
      (
        await axios.post(`${API_URL}/create-task`, {
          taskName: payload.taskName,
          description: payload.description,
          status: payload.status,
          priority: payload.priority,
          dueDate: payload.dueDate,
        })
      ).data,
    async () => {
      const tasks = readLocal();
      const newTask = {
        id: nextLocalId(tasks),
        taskName: payload.taskName,
        description: payload.description ?? "",
        status: payload.status ?? STATUS.PENDING,
        priority: payload.priority,
        createdOn: Date.now(),
        dueDate: payload.dueDate,
      };
      tasks.push(newTask);
      writeLocal(tasks);
      return { id: newTask.id };
    },
  );

export const updateTask = (id, patch) =>
  write(
    async () =>
      (await axios.put(`${API_URL}/update-tasks/${id}`, patch)).data,
    async () => {
      const tasks = readLocal();
      const index = tasks.findIndex((task) => Number(task.id) === Number(id));
      if (index === -1) throw new Error("Task not found");
      tasks[index] = { ...tasks[index], ...patch };
      writeLocal(tasks);
      return tasks[index];
    },
  );

export const removeTask = (id) =>
  write(
    async () => (await axios.delete(`${API_URL}/remove-tasks/${id}`)).data,
    async () => {
      const tasks = readLocal();
      writeLocal(tasks.filter((task) => Number(task.id) !== Number(id)));
      return { message: "Task deleted" };
    },
  );

export const resetSource = () => {
  source = null;
};
