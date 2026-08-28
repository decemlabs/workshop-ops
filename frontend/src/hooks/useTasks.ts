import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { tasksApi } from '@/api/resources'
import type { BulkStatusInput, TaskListParams } from '@/api/types'
import { createResourceHooks } from './createResourceHooks'

const hooks = createResourceHooks(tasksApi, 'tasks')

export const taskKeys = {
  ...hooks.keys,
  summary: (params?: TaskListParams) => ['tasks', 'summary', params ?? {}] as const,
}

export const useTasks = hooks.useList
export const useTask = hooks.useDetail
export const useCreateTask = hooks.useCreate
export const useUpdateTask = hooks.useUpdate
export const useDeleteTask = hooks.useRemove
export const useBulkDeleteTasks = hooks.useBulkDelete
export const useRestoreTasks = hooks.useRestore

/** Смена статуса у выбранных задач — одним запросом. */
export function useBulkTaskStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: BulkStatusInput) => tasksApi.bulkStatus(payload),
    onSuccess: () => queryClient.invalidateQueries(),
  })
}

/** Счётчики по статусам. Ключ лежит внутри scope 'tasks', поэтому мутации задач его тоже сбрасывают. */
export function useTaskSummary(params?: TaskListParams) {
  return useQuery({
    queryKey: taskKeys.summary(params),
    queryFn: ({ signal }) => tasksApi.summary(params, signal),
  })
}
