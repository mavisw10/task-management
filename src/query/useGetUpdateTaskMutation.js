import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { updateTask } from "@/api/taskApi";

export const useGetUpdateTaskMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }) => updateTask(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};
