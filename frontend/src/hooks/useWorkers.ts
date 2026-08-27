import { workersApi } from '@/api/resources'
import { createResourceHooks } from './createResourceHooks'

const hooks = createResourceHooks(workersApi, 'workers')

export const workerKeys = hooks.keys
export const useWorkers = hooks.useList
export const useWorker = hooks.useDetail
export const useCreateWorker = hooks.useCreate
export const useUpdateWorker = hooks.useUpdate
export const useDeleteWorker = hooks.useRemove
