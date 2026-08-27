/** Типы ответов REST API (см. backend/src/apps/workshops/serializers.py). */

/** Ответ DRF с пагинацией (PageNumberPagination, PAGE_SIZE = 50). */
export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface Workshop {
  id: number
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Worker {
  id: number
  name: string
  workshop: number
  /** read-only, приходит из workshop.name */
  workshop_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export const TASK_STATUSES = ['new', 'in_progress', 'done'] as const

export type TaskStatus = (typeof TASK_STATUSES)[number]

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  new: 'новая',
  in_progress: 'в работе',
  done: 'выполнена',
}

export interface Task {
  id: number
  title: string
  worker: number
  /** read-only, приходит из worker.name */
  worker_name: string
  status: TaskStatus
  created_at: string
  updated_at: string
}

/** Ответ GET /api/tasks/summary/ */
export interface TaskSummary {
  total: number
  by_status: {
    status: TaskStatus
    label: string
    count: number
  }[]
}

/** Значение фильтра ?is_active= у цехов и рабочих. По умолчанию бэк отдаёт 'true'. */
export type ActiveFilter = 'true' | 'false' | 'all'

/** Поля, которые принимает бэк при создании/изменении (read-only исключены). */
export type WorkshopInput = Pick<Workshop, 'name'> & Partial<Pick<Workshop, 'is_active'>>
export type WorkerInput = Pick<Worker, 'name' | 'workshop'> & Partial<Pick<Worker, 'is_active'>>
export type TaskInput = Pick<Task, 'title' | 'worker'> & Partial<Pick<Task, 'status'>>

/** Общие query-параметры списков: поиск, сортировка, страница. */
export interface ListParams {
  search?: string
  ordering?: string
  page?: number
}

export interface WorkshopListParams extends ListParams {
  is_active?: ActiveFilter
}

export interface WorkerListParams extends ListParams {
  is_active?: ActiveFilter
  workshop?: number
}

export interface TaskListParams extends ListParams {
  status?: TaskStatus
  worker?: number
  /** фильтр по цеху рабочего: ?worker__workshop=1 */
  worker__workshop?: number
}
