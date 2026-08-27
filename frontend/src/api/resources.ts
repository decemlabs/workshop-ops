/** CRUD-ресурсы поверх fetch-клиента: по одному на роутер из backend/src/config/api.py. */

import { api } from './client'
import type {
  Paginated,
  Task,
  TaskInput,
  TaskListParams,
  TaskSummary,
  Worker,
  WorkerInput,
  WorkerListParams,
  Workshop,
  WorkshopInput,
  WorkshopListParams,
} from './types'

export interface Resource<T, TInput, TParams extends object> {
  list: (params?: TParams, signal?: AbortSignal) => Promise<Paginated<T>>
  get: (id: number, signal?: AbortSignal) => Promise<T>
  create: (payload: TInput) => Promise<T>
  /** PATCH: частичное обновление. */
  update: (id: number, payload: Partial<TInput>) => Promise<T>
  /** PUT: полная замена, бэк потребует все обязательные поля. */
  replace: (id: number, payload: TInput) => Promise<T>
  remove: (id: number) => Promise<null>
}

function createResource<T, TInput, TParams extends object>(
  basePath: string,
): Resource<T, TInput, TParams> {
  return {
    list: (params, signal) =>
      api.get<Paginated<T>>(`/${basePath}/`, params as Record<string, unknown>, signal),
    get: (id, signal) => api.get<T>(`/${basePath}/${id}/`, undefined, signal),
    create: (payload) => api.post<T>(`/${basePath}/`, payload),
    update: (id, payload) => api.patch<T>(`/${basePath}/${id}/`, payload),
    replace: (id, payload) => api.put<T>(`/${basePath}/${id}/`, payload),
    remove: (id) => api.delete(`/${basePath}/${id}/`),
  }
}

export const workshopsApi = createResource<Workshop, WorkshopInput, WorkshopListParams>('workshops')

export const workersApi = createResource<Worker, WorkerInput, WorkerListParams>('workers')

export const tasksApi = {
  ...createResource<Task, TaskInput, TaskListParams>('tasks'),

  /** Сводка по статусам: GET /api/tasks/summary/ принимает те же фильтры, что и список. */
  summary: (params?: TaskListParams, signal?: AbortSignal) =>
    api.get<TaskSummary>('/tasks/summary/', params as Record<string, unknown>, signal),
}
