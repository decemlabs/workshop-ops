/** Константы разметки: подписи статусов, цвета и размер страницы. */

import type { State, Status } from './types'

export const STATUSES: Status[] = ['Новая', 'В работе', 'Выполнено']

export const COLORS: Record<Status, string> = {
  Новая: 'var(--faint)',
  'В работе': 'var(--accent)',
  Выполнено: 'var(--ok)',
}

/** Строк в списке на страницу — уходит в ?page_size= (const PAGE = 12 в оригинале). */
export const PAGE = 12

/** Сколько записей просим у справочников (селекты, drop-зоны) — max_page_size бэка. */
export const DICT_PAGE = 100

/** Состояние интерфейса на старте: данные живут в кэше react-query, не здесь. */
export const INITIAL_STATE: State = {
  login: '',
  pass: '',
  authErr: '',
  modal: null,
  confirm: null,
  q: '',
  fShop: '',
  fStatus: '',
  fWorker: '',
  selW: [],
  selT: [],
  qShop: '',
  sortS: 'name',
  dirS: 1,
  dragOver: null,
  actionErr: null,
  online: true,
  sortW: 'name',
  dirW: 1,
  sortT: 'title',
  dirT: 1,
  pageW: 1,
  pageT: 1,
  undo: null,
}
