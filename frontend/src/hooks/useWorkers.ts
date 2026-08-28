import { useMutation, useQueryClient } from '@tanstack/react-query'

import { workersApi } from '@/api/resources'
import type { BulkMoveInput } from '@/api/types'
import { createResourceHooks } from './createResourceHooks'

const hooks = createResourceHooks(workersApi, 'workers')

export const workerKeys = hooks.keys
export const useWorkers = hooks.useList
export const useWorker = hooks.useDetail
export const useCreateWorker = hooks.useCreate
export const useUpdateWorker = hooks.useUpdate
export const useDeleteWorker = hooks.useRemove
export const useBulkDeleteWorkers = hooks.useBulkDelete
export const useRestoreWorkers = hooks.useRestore

/** Перевод выбранных рабочих в другой цех — одним запросом. */
export function useBulkMoveWorkers() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: BulkMoveInput) => workersApi.bulkMove(payload),
    onSuccess: () => queryClient.invalidateQueries(),
  })
}
