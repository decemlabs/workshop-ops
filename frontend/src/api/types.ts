/** Типы ответов REST API (см. backend/src/apps/workshops/serializers.py). */

/** Ответ DRF с пагинацией (PageNumberPagination, PAGE_SIZE = 50, max 100). */
export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

/** Столбик загрузки рабочего на карточке цеха. */
export interface WorkerLoad {
  id: number
  name: string
  active_tasks: number
}

export interface Workshop {
  id: number
  number: number
  name: string
  is_active: boolean
  /** Счётчики считает бэк (annotate), клиент их не пересчитывает. */
  workers_count: number
  active_tasks: number
  done_tasks: number
  workers_load: WorkerLoad[]
  created_at: string
  updated_at: string
}

export interface Worker {
  id: number
  name: string
  workshop: number
  /** read-only, приходит из workshop.name */
  workshop_name: string
  workshop_number: number
  is_active: boolean
  tasks_total: number
  active_tasks: number
  done_tasks: number
  /** null, если задач нет */
  last_task_title: string | null
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
  /** read-only, генерируется моделью: ЗН-4801 */
  code: string
  title: string
  /** задача принадлежит цеху, а не рабочему */
  workshop: number
  /** read-only, приходит из workshop.name */
  workshop_name: string
  workshop_number: number
  /** null, если задача лежит в цехе без исполнителя */
  worker: number | null
  /** read-only, приходит из worker.name */
  worker_name: string | null
  /** прежний исполнитель: кто выполнил задачу, оставшуюся ничьей */
  former_worker_name: string | null
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

/** Пользователь: GET /api/auth/me/, POST /api/auth/login/. */
export interface User {
  id: number
  username: string
  first_name: string
  last_name: string
  /** ФИО или логин, если ФИО не заполнено */
  name: string
}

export interface LoginInput {
  username: string
  password: string
}

/** Значение фильтра ?is_active= у цехов и рабочих. По умолчанию бэк отдаёт 'true'. */
export type ActiveFilter = 'true' | 'false' | 'all'

/** Поля, которые принимает бэк при создании/изменении (read-only исключены). */
export type WorkshopInput = Pick<Workshop, 'number' | 'name'> &
  Partial<Pick<Workshop, 'is_active'>>
export type WorkerInput = Pick<Worker, 'name' | 'workshop'> & Partial<Pick<Worker, 'is_active'>>
export type TaskInput = Pick<Task, 'title' | 'workshop'> &
  Partial<Pick<Task, 'worker' | 'status'>>

/** Общие query-параметры списков: поиск, сортировка, страница. */
export interface ListParams {
  search?: string
  ordering?: string
  page?: number
  /** page_size_query_param в config/pagination.py, максимум 100. */
  page_size?: number
}

export interface WorkshopListParams extends ListParams {
  is_active?: ActiveFilter
  number?: number
}

export interface WorkerListParams extends ListParams {
  is_active?: ActiveFilter
  workshop?: number
}

export interface TaskListParams extends ListParams {
  status?: TaskStatus
  worker?: number
  /** фильтр по цеху задачи: ?workshop=1 */
  workshop?: number
}

/** Тело массовых операций SoftDeleteMixin: bulk-delete и restore. */
export interface BulkIdsInput {
  ids: number[]
}

export interface BulkMoveInput extends BulkIdsInput {
  workshop: number
}

export interface BulkStatusInput extends BulkIdsInput {
  status: TaskStatus
}

/** batch приходит только у bulk-delete: по нему бэк восстанавливает партию. */
export interface BulkResult {
  updated: number
  batch?: string
}
