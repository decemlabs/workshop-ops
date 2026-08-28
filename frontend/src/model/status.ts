/** Подписи статусов из дизайна и коды API (Task.Status на бэкенде). */

import type { TaskStatus } from '@/api/types'
import type { Status } from './types'

export const STATUS_CODE: Record<Status, TaskStatus> = {
  Новая: 'new',
  'В работе': 'in_progress',
  Выполнено: 'done',
}

export const STATUS_LABEL: Record<TaskStatus, Status> = {
  new: 'Новая',
  in_progress: 'В работе',
  done: 'Выполнено',
}
