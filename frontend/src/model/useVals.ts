/**
 * Порт renderVals() из прототипа: значения, на которые ссылается разметка.
 *
 * Имена ключей сохранены, изменились источники: строки приходят из API вместе
 * с посчитанными на сервере агрегатами, а фильтры, сортировки и страницы уже
 * применены запросом.
 */

import type { ChangeEvent, DragEvent, KeyboardEvent } from 'react'

import type { Task as ApiTask, Worker as ApiWorker, Workshop } from '@/api/types'

import { COLORS, PAGE, STATUSES } from './mock'
import { SETTINGS } from './settings'
import { STATUS_LABEL } from './status'
import type { AppModel } from './useAppModel'
import type { Modal, State, Status } from './types'

export interface Option {
  value: string
  label: string
  /** Строка-пояснение в списке: выбрать её нельзя. */
  disabled?: boolean
}

export interface TaskRow {
  title: string
  code: string
  status: Status
  color: string
  worker: string
  shop: string
  edit: () => void
  del: () => void
  sel: boolean
  toggle: () => void
}

export interface WorkerRow {
  name: string
  shop: string
  active: number
  done: number
  total: number
  bar: string
  lastTask: string
  open: () => void
  edit: () => void
  del: () => void
  sel: boolean
  toggle: () => void
  onDragStart: (e: DragEvent) => void
  onDragEnd: () => void
}

export interface ShopRow {
  num: number
  name: string
  workers: number
  active: number
  done: number
  bars: { h: string; c: string }[]
  open: () => void
  edit: () => void
  del: () => void
}

export interface DropShop {
  label: string
  count: number
  bg: string
  fg: string
  onDragOver: (e: DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: DragEvent) => void
}

/** «Цех №10 · Механический» — подпись цеха во всех списках. */
const shopLabel = (number?: number, name?: string) =>
  number == null ? '—' : `Цех №${number} · ${name}`

export function useVals(model: AppModel) {
  const {
    st,
    setState,
    load,
    view,
    route,
    navigate,
    dragIds,
    data,
    keyActivate,
    openModal,
    askDelete,
    undoDelete,
    setSort,
    toggleSel,
    bulkDelete,
    bulkStatus,
    moveWorkers,
    save,
    field,
    submitLogin,
    logout,
  } = model

  const showCodes = SETTINGS.showTaskCodes !== false
  const defStatus = SETTINGS.defaultTaskStatus || 'Новая'
  const m = st.modal
  const cur = data.workshop
  const curW = data.worker

  const taskRow = (t: ApiTask): TaskRow => {
    const status = STATUS_LABEL[t.status]
    return {
      title: t.title,
      code: showCodes ? t.code : '',
      status,
      color: COLORS[status],
      worker: t.worker_name,
      shop: shopLabel(t.worker_workshop_number, t.worker_workshop_name),
      edit: () =>
        openModal({ kind: 'task', id: t.id, name: t.title, workerId: t.worker, status }),
      del: () => askDelete({ kind: 'task', id: t.id, label: t.title }),
      sel: st.selT.indexOf(t.id) !== -1,
      toggle: () => toggleSel('t', t.id),
    }
  }

  const workerRow = (w: ApiWorker): WorkerRow => ({
    name: w.name,
    shop: shopLabel(w.workshop_number, w.workshop_name),
    active: w.active_tasks,
    done: w.done_tasks,
    total: w.tasks_total,
    bar:
      w.active_tasks === 0 ? 'var(--faint)' : w.active_tasks >= 4 ? 'var(--danger)' : 'var(--accent)',
    lastTask: w.last_task_title || 'задач нет',
    open: () => navigate('/workers/' + w.id),
    edit: () => openModal({ kind: 'worker', id: w.id, name: w.name, shopId: w.workshop }),
    del: () => askDelete({ kind: 'worker', id: w.id, label: w.name }),
    sel: st.selW.indexOf(w.id) !== -1,
    toggle: () => toggleSel('w', w.id),
    onDragStart: (e) => {
      const ids = st.selW.indexOf(w.id) !== -1 ? st.selW : [w.id]
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', ids.join(','))
      dragIds.current = ids
    },
    onDragEnd: () => {
      dragIds.current = null
      setState({ dragOver: null })
    },
  })

  const isActive = (v: string) =>
    view === v || (v === 'shops' && (view === 'shop' || view === 'worker'))
  const navBg = (v: string) => (isActive(v) ? 'var(--accent)' : 'transparent')
  const navBar = (v: string) => (isActive(v) ? 'var(--accent)' : 'rgba(var(--paper-rgb),.28)')

  const counts = new Map((data.summary?.by_status ?? []).map((i) => [i.status, i.count]))
  const countTasks = data.summary?.total ?? 0
  const total = countTasks || 1
  const pct = (n: number) => Math.round((1000 * n) / total) / 10 + '%'
  const countNew = counts.get('new') ?? 0
  const countInWork = counts.get('in_progress') ?? 0
  const countDone = counts.get('done') ?? 0

  const arrow = (list: 'w' | 't', key: string) => {
    const sk = list === 'w' ? st.sortW : st.sortT
    const d = list === 'w' ? st.dirW : st.dirT
    return sk === key ? (d > 0 ? '↑' : '↓') : ''
  }

  const sArrow = (key: string) => (st.sortS === key ? (st.dirS > 0 ? '↑' : '↓') : '')
  const setSortS = (key: State['sortS']) =>
    setState({ sortS: key, dirS: st.sortS === key ? -st.dirS : 1 })

  /** «13–24 из 57» по номеру страницы API и общему количеству. */
  const pageLabel = (count: number, page: number) =>
    count === 0 ? '0' : `${(page - 1) * PAGE + 1}–${Math.min(count, page * PAGE)} из ${count}`
  const lastPage = (count: number) => Math.max(1, Math.ceil(count / PAGE))

  /** Списки берутся одной страницей: если влезло не всё, говорим об этом прямо. */
  const trimmed = (shown: number, total: number) =>
    total > shown ? `показаны первые ${shown} из ${total}` : ''
  const hintOption = (shown: number, total: number): Option[] => {
    const hint = trimmed(shown, total)
    return hint ? [{ value: '', label: `— ${hint} —`, disabled: true }] : []
  }

  const nf = new Intl.NumberFormat('ru-RU')
  const shiftDate = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return {
    theme: SETTINGS.darkTheme ? 'dark' : 'light',
    touch: SETTINGS.touchMode ? '1' : '0',
    shiftDate: shiftDate,
    loading: data.loading,
    notLoading: !data.loading,
    errorOpen: !!data.error,
    errorText: data.error || '',
    retry: () => load(),
    skeletonRows: [1, 2, 3, 4, 5, 6],
    onSortKeyName: keyActivate(() => setSort('w', 'name')),
    onSortKeyShop: keyActivate(() => setSort('w', 'shop')),
    onSortKeyLast: keyActivate(() => setSort('w', 'last')),
    onSortKeyLoad: keyActivate(() => setSort('w', 'load')),
    onSortKeyTTitle: keyActivate(() => setSort('t', 'title')),
    onSortKeyTWorker: keyActivate(() => setSort('t', 'worker')),
    onSortKeyTShop: keyActivate(() => setSort('t', 'shop')),
    onSortKeyTStatus: keyActivate(() => setSort('t', 'status')),
    nWorkers: nf.format(data.workersCount),
    nTasks: nf.format(countTasks),
    nShops: nf.format(data.shopsCount),
    notAuthed: data.anonymous,
    login: st.login,
    pass: st.pass,
    authErr: st.authErr,
    authBtn: data.authBusy ? 'Проверка…' : 'Войти',
    setLogin: (e: ChangeEvent<HTMLInputElement>) =>
      setState({ login: e.target.value, authErr: '' }),
    setPass: (e: ChangeEvent<HTMLInputElement>) => setState({ pass: e.target.value, authErr: '' }),
    submitLogin,
    logout,
    isShops: view === 'shops',
    isShop: view === 'shop',
    isWorker: view === 'worker',
    isWorkersAll: view === 'workers',
    isTasksAll: view === 'tasks',
    navShops: () => navigate('/shops'),
    navWorkers: () => navigate('/workers'),
    navTasks: () => navigate('/tasks'),
    navShopsBg: navBg('shops'),
    navWorkersBg: navBg('workers'),
    navTasksBg: navBg('tasks'),
    navShopsBar: navBar('shops'),
    navWorkersBar: navBar('workers'),
    navTasksBar: navBar('tasks'),
    countShops: data.shopsCount,
    countWorkers: data.workersCount,
    countTasks,
    countInWork,
    countNew,
    countDone,
    pctInWork: pct(countInWork),
    pctNew: pct(countNew),
    pctDone: pct(countDone),

    shopRows: data.workshops.map((s: Workshop): ShopRow => {
      const acts = s.workers_load.map((w) => w.active_tasks)
      const max = Math.max(1, ...acts)
      return {
        num: s.number,
        name: s.name,
        workers: s.workers_count,
        active: s.active_tasks,
        done: s.done_tasks,
        bars: acts.slice(0, 5).map((v) => ({
          h: Math.max(4, Math.round((26 * v) / max)) + 'px',
          c: v === max && v > 0 ? 'var(--accent)' : 'rgba(var(--accent-rgb),.35)',
        })),
        open: () => navigate('/shops/' + s.id),
        edit: () => openModal({ kind: 'shop', id: s.id, name: s.name, num: s.number }),
        del: () => askDelete({ kind: 'shop', id: s.id, label: shopLabel(s.number, s.name) }),
      }
    }),

    shopTitle: cur ? 'Цех №' + cur.number : 'Цех',
    shopMeta: cur ? cur.name + ' · рабочих ' + cur.workers_count : '',
    shopWorkerRows: data.shopWorkers.map(workerRow),
    shopEmpty: !st.qShop && data.shopWorkers.length === 0,
    shopSearchEmpty: !!st.qShop && data.shopWorkers.length === 0,
    qShop: st.qShop,
    onQShop: (e: ChangeEvent<HTMLInputElement>) => setState({ qShop: e.target.value }),
    shopFound:
      trimmed(data.shopWorkers.length, data.shopWorkersFound) === ''
        ? data.shopWorkers.length
        : `${data.shopWorkers.length} из ${data.shopWorkersFound}`,
    sortSName: sArrow('name'),
    sortSLast: sArrow('last'),
    sortSLoad: sArrow('load'),
    onSortSName: () => setSortS('name'),
    onSortSLast: () => setSortS('last'),
    onSortSLoad: () => setSortS('load'),
    onSortKeySName: keyActivate(() => setSortS('name')),
    onSortKeySLast: keyActivate(() => setSortS('last')),
    onSortKeySLoad: keyActivate(() => setSortS('load')),

    selWCount: st.selW.length,
    selWOn: st.selW.length > 0,
    clearSelW: () => setState({ selW: [] }),
    bulkDeleteWorkers: () => bulkDelete('w'),
    onBulkMoveShop: (e: ChangeEvent<HTMLSelectElement>) => {
      moveWorkers(st.selW, Number(e.target.value))
      e.target.value = ''
    },
    moveShopOptions: ([{ value: '', label: 'Перевести в цех…' }] as Option[])
      .concat(
        data.workshops.map((s) => ({ value: String(s.id), label: shopLabel(s.number, s.name) })),
      )
      .concat(hintOption(data.workshops.length, data.shopsCount)),
    selTCount: st.selT.length,
    selTOn: st.selT.length > 0,
    clearSelT: () => setState({ selT: [] }),
    bulkDeleteTasks: () => bulkDelete('t'),
    onBulkStatus: (e: ChangeEvent<HTMLSelectElement>) => {
      bulkStatus(e.target.value as Status)
      e.target.value = ''
    },
    bulkStatusOptions: ([{ value: '', label: 'Сменить статус…' }] as Option[]).concat(
      STATUSES.map((s) => ({ value: s, label: s })),
    ),
    dropShops: data.workshops.map(
      (s): DropShop => ({
        label: shopLabel(s.number, s.name),
        count: s.workers_count,
        bg: st.dragOver === s.id ? 'var(--accent)' : 'transparent',
        fg: st.dragOver === s.id ? 'var(--on-accent)' : 'var(--muted-strong)',
        onDragOver: (e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
          if (st.dragOver !== s.id) setState({ dragOver: s.id })
        },
        onDragLeave: () => {
          if (st.dragOver === s.id) setState({ dragOver: null })
        },
        onDrop: (e) => {
          e.preventDefault()
          const raw = e.dataTransfer.getData('text/plain')
          const ids = (raw ? raw.split(',').map(Number) : dragIds.current || []).filter(
            (n) => !isNaN(n),
          )
          moveWorkers(ids, s.id)
        },
      }),
    ),
    editShop: () =>
      cur && openModal({ kind: 'shop', id: cur.id, name: cur.name, num: cur.number }),
    addShop: () => openModal({ kind: 'shop', name: '', num: '' }),
    addWorker: () => openModal({ kind: 'worker', name: '', shopId: route.shopId }),
    addWorkerAny: () => openModal({ kind: 'worker', name: '', shopId: data.workshops[0]?.id }),

    workerName: curW ? curW.name : 'Рабочий',
    workerShop: curW ? shopLabel(curW.workshop_number, curW.workshop_name) : '—',
    workerMeta: curW
      ? 'активных ' +
        curW.active_tasks +
        ' · выполнено ' +
        curW.done_tasks +
        (trimmed(data.workerTasks.length, data.workerTasksFound)
          ? ' · ' + trimmed(data.workerTasks.length, data.workerTasksFound)
          : '')
      : '',
    workerTaskRows: data.workerTasks.map(taskRow),
    workerEmpty: !!curW && data.workerTasks.length === 0,
    backToShop: () => navigate(curW ? '/shops/' + curW.workshop : '/shops'),
    editWorker: () =>
      curW && openModal({ kind: 'worker', id: curW.id, name: curW.name, shopId: curW.workshop }),
    addTask: () =>
      openModal({ kind: 'task', name: '', workerId: route.workerId, status: defStatus }),
    addTaskAny: () =>
      openModal({ kind: 'task', name: '', workerId: data.workersDict[0]?.id, status: defStatus }),

    q: st.q,
    onQ: (e: ChangeEvent<HTMLInputElement>) => setState({ q: e.target.value, pageW: 1, pageT: 1 }),
    fShopFilter: st.fShop,
    onShopFilter: (e: ChangeEvent<HTMLSelectElement>) =>
      setState({ fShop: e.target.value, pageW: 1, pageT: 1 }),
    fStatusFilter: st.fStatus,
    onStatusFilter: (e: ChangeEvent<HTMLSelectElement>) =>
      setState({ fStatus: e.target.value, pageT: 1 }),
    fWorkerFilter: st.fWorker,
    onWorkerFilter: (e: ChangeEvent<HTMLSelectElement>) =>
      setState({ fWorker: e.target.value, pageT: 1 }),
    shopFilterOptions: ([{ value: '', label: 'Все цеха' }] as Option[])
      .concat(
        data.workshops.map((s) => ({ value: String(s.id), label: shopLabel(s.number, s.name) })),
      )
      .concat(hintOption(data.workshops.length, data.shopsCount)),
    statusFilterOptions: ([{ value: '', label: 'Все статусы' }] as Option[]).concat(
      STATUSES.map((s) => ({ value: s, label: s })),
    ),
    workerFilterOptions: ([{ value: '', label: 'Все рабочие' }] as Option[])
      .concat(data.workersDict.map((w) => ({ value: String(w.id), label: w.name })))
      .concat(hintOption(data.workersDict.length, data.workersCount)),
    filtersOn: !!(st.q || st.fShop || st.fStatus || st.fWorker),
    resetFilters: () =>
      setState({ q: '', fShop: '', fStatus: '', fWorker: '', pageW: 1, pageT: 1 }),

    sortWName: arrow('w', 'name'),
    sortWShop: arrow('w', 'shop'),
    sortWLast: arrow('w', 'last'),
    sortWLoad: arrow('w', 'load'),
    onSortWName: () => setSort('w', 'name'),
    onSortWShop: () => setSort('w', 'shop'),
    onSortWLast: () => setSort('w', 'last'),
    onSortWLoad: () => setSort('w', 'load'),
    sortTTitle: arrow('t', 'title'),
    sortTWorker: arrow('t', 'worker'),
    sortTShop: arrow('t', 'shop'),
    sortTStatus: arrow('t', 'status'),
    onSortTTitle: () => setSort('t', 'title'),
    onSortTWorker: () => setSort('t', 'worker'),
    onSortTShop: () => setSort('t', 'shop'),
    onSortTStatus: () => setSort('t', 'status'),

    allWorkerRows: data.workers.map(workerRow),
    workersFound: data.workersFound,
    workersEmpty: data.workersFound === 0,
    workerPageLabel: pageLabel(data.workersFound, st.pageW),
    workerPageOn: data.workersFound > PAGE,
    prevWorkerPage: () => setState({ pageW: Math.max(1, st.pageW - 1) }),
    nextWorkerPage: () =>
      setState({ pageW: Math.min(lastPage(data.workersFound), st.pageW + 1) }),

    allTaskRows: data.tasks.map(taskRow),
    tasksFound: data.tasksFound,
    tasksEmptyAll: data.tasksFound === 0,
    taskPageLabel: pageLabel(data.tasksFound, st.pageT),
    taskPageOn: data.tasksFound > PAGE,
    prevTaskPage: () => setState({ pageT: Math.max(1, st.pageT - 1) }),
    nextTaskPage: () => setState({ pageT: Math.min(lastPage(data.tasksFound), st.pageT + 1) }),

    undoOpen: !!st.undo,
    undoText: st.undo ? st.undo.label : '',
    doUndo: () => undoDelete(),
    dismissUndo: () => setState({ undo: null }),

    modalOpen: !!m,
    modalTitle: m ? (m.id ? 'Редактирование' : 'Создание') : '',
    modalKindLabel: m
      ? m.kind === 'shop'
        ? 'цех'
        : m.kind === 'worker'
          ? 'рабочий'
          : 'задача'
      : '',
    nameErr: m && m.err ? m.err : '',
    nameLabel: m && m.kind === 'worker' ? 'ИМЯ' : 'НАЗВАНИЕ',
    namePlaceholder: m
      ? m.kind === 'shop'
        ? 'Механический'
        : m.kind === 'worker'
          ? 'Иван Петров'
          : 'Покрасить деталь'
      : '',
    fName: m ? m.name || '' : '',
    onName: field('name' as keyof Modal),
    showNum: !!m && m.kind === 'shop',
    fNum: m ? String(m.num == null ? '' : m.num) : '',
    onNum: field('num' as keyof Modal),
    showShop: !!m && m.kind === 'worker',
    fShop: m && m.shopId != null ? String(m.shopId) : '',
    onShop: field('shopId' as keyof Modal),
    shopOptions: data.workshops
      .map((s): Option => ({ value: String(s.id), label: 'Цех №' + s.number + ' — ' + s.name }))
      .concat(hintOption(data.workshops.length, data.shopsCount)),
    showWorkerSelect: !!m && m.kind === 'task',
    fWorker: m && m.workerId != null ? String(m.workerId) : '',
    onWorker: field('workerId' as keyof Modal),
    workerOptions: data.workersDict
      .map(
        (w): Option => ({
          value: String(w.id),
          label: w.name + ' · ' + shopLabel(w.workshop_number, w.workshop_name),
        }),
      )
      .concat(hintOption(data.workersDict.length, data.workersCount)),
    showStatus: !!m && m.kind === 'task',
    fStatus: m ? m.status || defStatus : '',
    onStatus: field('status' as keyof Modal),
    statusOptions: STATUSES.map((s): Option => ({ value: s, label: s })),
    closeModal: () => setState({ modal: null }),
    saveModal: () => save(),

    confirmOpen: !!st.confirm,
    confirmText: st.confirm
      ? st.confirm.kind === 'shop'
        ? 'Удалить «' + st.confirm.label + '»? Рабочие цеха и их задачи будут удалены.'
        : st.confirm.kind === 'worker'
          ? 'Удалить рабочего «' + st.confirm.label + '» вместе с его задачами?'
          : 'Удалить задачу «' + st.confirm.label + '»?'
      : '',
    closeConfirm: () => setState({ confirm: null }),
    doDelete: () => st.confirm && model.remove(st.confirm),
  }
}

export type Vals = ReturnType<typeof useVals>
export type { KeyboardEvent }
