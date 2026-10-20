import { useQuery } from "@tanstack/vue-query";
import { unref } from "vue";
import { listTasks } from "@/api/taskApi";

export const useGetTaskListQuery = (filters) => {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: () => listTasks(unref(filters)),
    staleTime: 300000,
  });
};
