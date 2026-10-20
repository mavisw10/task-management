const express = require("express")
const cors = require("cors")

const app = express()

// =========================
// Middleware
// =========================
app.use(cors())
app.use(express.json())

// =========================
// In-memory database
// =========================
let tasks = []
let nextId = 1

const isSet = (value) => value !== undefined && value !== null && value !== ""

// "YYYY-MM-DD" in local time, used to compare dates by day
const dayKey = (timestamp) => {
  const date = new Date(Number(timestamp))
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

// =========================
// GET ALL TASKS (all filters combine with AND)
// =========================
app.get("/get-task-list", (req, res) => {
  const { taskName, status, priority, dueDate, createdOn } = req.query

  let result = tasks

  if (isSet(taskName)) {
    const keyword = String(taskName).toLowerCase()
    result = result.filter((task) => task.taskName.toLowerCase().includes(keyword))
  }
  if (isSet(status)) {
    result = result.filter((task) => task.status === Number(status))
  }
  if (isSet(priority)) {
    result = result.filter((task) => task.priority === Number(priority))
  }
  if (isSet(dueDate)) {
    result = result.filter((task) => Number(task.dueDate) === Number(dueDate))
  }
  if (isSet(createdOn)) {
    const targetDay = dayKey(createdOn)
    result = result.filter((task) => dayKey(task.createdOn) === targetDay)
  }

  res.status(200).json(result)
})

// =========================
// GET SINGLE TASK
// =========================
app.get("/tasks/:id", (req, res) => {
  const id = Number(req.params.id)

  const task = tasks.find((task) => task.id === id)

  if (!task) {
    return res.status(404).json({
      message: "Task not found",
    })
  }

  res.json(task)
})

// =========================
// CREATE TASK
// =========================
app.post("/create-task", (req, res) => {
  const { taskName, description, status, priority, dueDate } = req.body

  if (!taskName || !priority || !dueDate) {
    return res.status(400).json({
      message: "value cannot be empty",
    })
  }

  const newTask = {
    id: nextId++,
    taskName,
    description,
    status: status || 1,
    priority,
    createdOn: Date.now(),
    dueDate,
  }

  tasks.push(newTask)

  res.status(201).json({
    id: newTask.id,
  })
})

// =========================
// UPDATE TASK
// =========================
app.put("/update-tasks/:id", (req, res) => {
  const id = Number(req.params.id)

  const index = tasks.findIndex((task) => task.id === id)

  if (index === -1) {
    return res.status(404).json({
      message: "Task not found",
    })
  }

  tasks[index] = {
    ...tasks[index],
    ...req.body,
  }

  res.json(tasks[index])
})

// =========================
// DELETE TASK
// =========================
app.delete("/remove-tasks/:id", (req, res) => {
  const id = Number(req.params.id)

  const exists = tasks.some((task) => task.id === id)

  if (!exists) {
    return res.status(404).json({
      message: "Task not found",
    })
  }

  tasks = tasks.filter((task) => task.id !== id)

  res.json({
    message: "Task deleted",
  })
})

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
