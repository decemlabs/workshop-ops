/** Типы состояния прототипа (порт state из класса DCLogic). */

export type Status = 'Новая' | 'В работе' | 'Выполнено'

export type Kind = 'shop' | 'worker' | 'task'

export interface Shop {
  id: number
  num: number
  name: string
}

export interface Worker {
  id: number
  name: string
  shopId: number
}

export interface Task {
  id: number
  title: string
  workerId: number
  status: Status
}

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

/** Снимок данных для «Вернуть». path заменяет view/shopId/workerId оригинала. */
export interface Undo {
  label: string
  shops: Shop[]
  workers: Worker[]
  tasks: Task[]
  path: string
}

export type SortW = 'name' | 'shop' | 'last' | 'load'
export type SortT = 'title' | 'worker' | 'shop' | 'status'
export type SortS = 'name' | 'last' | 'load'

export interface State {
  authed: boolean
  login: string
  pass: string
  authErr: string
  authBusy: boolean
  modal: Modal | null
  confirm: Confirm | null
  seq: number
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
  loading: boolean
  error: string | null
  online: boolean
  sortW: SortW
  dirW: number
  sortT: SortT
  dirT: number
  pageW: number
  pageT: number
  undo: Undo | null
  shops: Shop[]
  workers: Worker[]
  tasks: Task[]
}
