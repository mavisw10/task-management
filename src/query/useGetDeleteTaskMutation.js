import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { removeTask } from "@/api/taskApi";

export const useGetDeleteTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => removeTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};
