import type { Status } from './types'

/**
 * Пропсы канваса Claude Design со значениями по умолчанию.
 * В прототипе их меняли в редакторе, здесь это константы.
 */
export const SETTINGS = {
  /** Спрашивать подтверждение перед удалением. */
  confirmDelete: true,
  /** Статус новой задачи по умолчанию. */
  defaultTaskStatus: 'Новая' as Status,
  /** Показывать коды задач (ЗН-4801). */
  showTaskCodes: true,
  darkTheme: false,
  touchMode: false,
}
