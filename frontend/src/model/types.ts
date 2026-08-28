/** Типы состояния интерфейса (порт state из класса DCLogic). */

export type Status = 'Новая' | 'В работе' | 'Выполнено'

export type Kind = 'shop' | 'worker' | 'task'

/** Черновик формы создания/редактирования: поля лежат вперемешку, как в оригинале. */
export interface Modal {
  kind: Kind
  id?: number
  name?: string
  num?: number | string
  shopId?: number | string
  workerId?: number | string
  status?: Status
  err?: string
}

export interface Confirm {
  kind: Kind
  id: number
  label: string
}

/**
 * Откат для тоста «Вернуть».
 *
 * Вместо снимка списков — обратное действие: restore для удаления, обратный
 * перевод для смены цеха, прежние статусы для массовой смены.
 */
export interface Undo {
  label: string
  run: () => Promise<unknown>
}

export type SortW = 'name' | 'shop' | 'last' | 'load'
export type SortT = 'title' | 'worker' | 'shop' | 'status'
export type SortS = 'name' | 'last' | 'load'

export interface State {
  login: string
  pass: string
  authErr: string
  modal: Modal | null
  confirm: Confirm | null
  q: string
  fShop: string
  fStatus: string
  fWorker: string
  selW: number[]
  selT: number[]
  qShop: string
  sortS: SortS
  dirS: number
  dragOver: number | null
  /** Ошибка действия (сохранение, удаление) — в баннере, а не в модалке. */
  actionErr: string | null
  online: boolean
  sortW: SortW
  dirW: number
  sortT: SortT
  dirT: number
  /** Номера страниц API, с единицы. */
  pageW: number
  pageT: number
  undo: Undo | null
}
