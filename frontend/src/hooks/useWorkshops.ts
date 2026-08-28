import { workshopsApi } from '@/api/resources'
import { createResourceHooks } from './createResourceHooks'

const hooks = createResourceHooks(workshopsApi, 'workshops')

export const workshopKeys = hooks.keys
export const useWorkshops = hooks.useList
export const useWorkshop = hooks.useDetail
export const useCreateWorkshop = hooks.useCreate
export const useUpdateWorkshop = hooks.useUpdate
export const useDeleteWorkshop = hooks.useRemove
export const useBulkDeleteWorkshops = hooks.useBulkDelete
export const useRestoreWorkshops = hooks.useRestore
