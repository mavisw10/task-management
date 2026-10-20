import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { createTask } from "@/api/taskApi";

export const useGetCreateTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables) => createTask(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};
