/** Данные и константы прототипа. */

import type { Shop, State, Status, Task, Worker } from './types'

export const STATUSES: Status[] = ['Новая', 'В работе', 'Выполнено']

export const COLORS: Record<Status, string> = {
  Новая: 'var(--faint)',
  'В работе': 'var(--accent)',
  Выполнено: 'var(--ok)',
}

const SHOPS: Shop[] = [
  { id: 1, num: 10, name: 'Механический' },
  { id: 2, num: 2, name: 'Сборочный' },
  { id: 3, num: 7, name: 'Термический' },
  { id: 4, num: 4, name: 'Инструментальный' },
]

const WORKERS: Worker[] = [
  { id: 1, name: 'Иван Петров', shopId: 1 },
  { id: 2, name: 'Алексей Смирнов', shopId: 1 },
  { id: 3, name: 'Дмитрий Соловьёв', shopId: 1 },
  { id: 4, name: 'Кирилл Тихонов', shopId: 2 },
  { id: 5, name: 'Роман Мамедов', shopId: 2 },
  { id: 6, name: 'Виктор Ильин', shopId: 3 },
]

const TASKS: Task[] = [
  { id: 1, title: 'Покрасить деталь', workerId: 1, status: 'В работе' },
  { id: 2, title: 'Проверить станок', workerId: 1, status: 'Выполнено' },
  { id: 3, title: 'Собрать конструкцию', workerId: 1, status: 'В работе' },
  { id: 4, title: 'Расточить корпус 12.480', workerId: 1, status: 'В работе' },
  { id: 5, title: 'Заточить резцы', workerId: 1, status: 'Выполнено' },
  { id: 6, title: 'Партия фланцев 44.201', workerId: 2, status: 'В работе' },
  { id: 7, title: 'Смазка узлов', workerId: 2, status: 'Выполнено' },
  { id: 8, title: 'Шлифовка кронштейна', workerId: 3, status: 'Новая' },
  { id: 9, title: 'Сдать втулки в ОТК', workerId: 4, status: 'В работе' },
  { id: 10, title: 'Замена оснастки 6Р13', workerId: 5, status: 'Новая' },
  { id: 11, title: 'Термообработка вала', workerId: 6, status: 'Выполнено' },
]

export const INITIAL_STATE: State = {
  authed: false,
  login: '',
  pass: '',
  authErr: '',
  authBusy: false,
  modal: null,
  confirm: null,
  seq: 100,
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
  loading: true,
  error: null,
  online: true,
  sortW: 'name',
  dirW: 1,
  sortT: 'title',
  dirT: 1,
  pageW: 0,
  pageT: 0,
  undo: null,
  shops: SHOPS,
  workers: WORKERS,
  tasks: TASKS,
}

/** Строк в списке на страницу — const PAGE = 12 в оригинале. */
export const PAGE = 12
