/**
 * Порт renderVals() из прототипа: значения, на которые ссылается разметка.
 *
 * Имена ключей и порядок вычислений — как в оригинале, чтобы компоненты можно было
 * сверять с шаблоном строка в строку.
 */

import type { ChangeEvent, DragEvent, KeyboardEvent } from 'react'

import { COLORS, PAGE, STATUSES } from './mock'
import { SETTINGS } from './settings'
import type { AppModel } from './useAppModel'
import type { Modal, Shop, State, Status, Task, Worker } from './types'

export interface Option {
  value: string
  label: string
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
  pct: string
  bar: string
  load: string
  chips: { c: string }[]
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

export function useVals(model: AppModel) {
  const {
    st,
    setState,
    load,
    view,
    route,
    navigate,
    dragIds,
    keyActivate,
    shop,
    worker,
    shopLabel,
    tasksOf,
    activeOf,
    doneOf,
    code,
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
  } = model

  const showCodes = SETTINGS.showTaskCodes !== false
  const defStatus = SETTINGS.defaultTaskStatus || 'Новая'
  const m = st.modal
  const cur = shop(route.shopId)
  const curW = worker(route.workerId)
  const shopWorkers = st.workers.filter((w) => w.shopId === route.shopId)

  const taskRow = (t: Task): TaskRow => ({
    title: t.title,
    code: showCodes ? code(t) : '',
    status: t.status,
    color: COLORS[t.status],
    worker: worker(t.workerId)?.name || '—',
    shop: shopLabel(shop(worker(t.workerId)?.shopId ?? 0)),
    edit: () =>
      openModal({ kind: 'task', id: t.id, name: t.title, workerId: t.workerId, status: t.status }),
    del: () => askDelete({ kind: 'task', id: t.id, label: t.title }),
    sel: st.selT.indexOf(t.id) !== -1,
    toggle: () => toggleSel('t', t.id),
  })

  const workerRow = (w: Worker): WorkerRow => ({
    name: w.name,
    shop: shopLabel(shop(w.shopId)),
    active: activeOf(w.id),
    done: doneOf(w.id),
    total: tasksOf(w.id).length,
    pct: Math.round((100 * activeOf(w.id)) / Math.max(1, tasksOf(w.id).length)) + '%',
    bar: activeOf(w.id) === 0 ? 'var(--faint)' : activeOf(w.id) >= 4 ? 'var(--danger)' : 'var(--accent)',
    load: tasksOf(w.id).length
      ? Math.round((100 * doneOf(w.id)) / tasksOf(w.id).length) + '%'
      : '0%',
    chips: tasksOf(w.id)
      .slice(0, 6)
      .map((t) => ({ c: COLORS[t.status] })),
    lastTask: tasksOf(w.id).slice(-1)[0]?.title || 'задач нет',
    open: () => navigate('/workers/' + w.id),
    edit: () => openModal({ kind: 'worker', id: w.id, name: w.name, shopId: w.shopId }),
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
  const total = st.tasks.length || 1
  const pct = (n: number) => Math.round((1000 * n) / total) / 10 + '%'

  const q = st.q.trim().toLowerCase()
  const arrow = (list: 'w' | 't', key: string) => {
    const sk = list === 'w' ? st.sortW : st.sortT
    const d = list === 'w' ? st.dirW : st.dirT
    return sk === key ? (d > 0 ? '↑' : '↓') : ''
  }
  const cmp = (a: string | number, b: string | number) =>
    typeof a === 'number' ? a - (b as number) : String(a).localeCompare(String(b), 'ru')
  const lastOf = (w: Worker) => tasksOf(w.id).slice(-1)[0]?.title || ''

  let fw = st.workers.filter(
    (w) =>
      (!st.fShop || w.shopId === Number(st.fShop)) &&
      (!q || (w.name + ' ' + shopLabel(shop(w.shopId))).toLowerCase().indexOf(q) !== -1),
  )
  const wKey = (w: Worker) =>
    st.sortW === 'shop'
      ? shopLabel(shop(w.shopId))
      : st.sortW === 'last'
        ? lastOf(w)
        : st.sortW === 'load'
          ? activeOf(w.id)
          : w.name
  fw = fw.slice().sort((a, b) => st.dirW * cmp(wKey(a), wKey(b)))

  let ft = st.tasks.filter((t) => {
    const w = worker(t.workerId)
    return (
      (!st.fStatus || t.status === st.fStatus) &&
      (!st.fWorker || t.workerId === Number(st.fWorker)) &&
      (!st.fShop || w?.shopId === Number(st.fShop)) &&
      (!q || (t.title + ' ' + code(t) + ' ' + (w?.name || '')).toLowerCase().indexOf(q) !== -1)
    )
  })
  const tKey = (t: Task) => {
    const w = worker(t.workerId)
    return st.sortT === 'worker'
      ? w?.name || ''
      : st.sortT === 'shop'
        ? shopLabel(shop(w?.shopId ?? 0))
        : st.sortT === 'status'
          ? STATUSES.indexOf(t.status)
          : t.title
  }
  ft = ft.slice().sort((a, b) => st.dirT * cmp(tKey(a), tKey(b)))

  const clamp = (page: number, len: number) => Math.min(page, Math.max(0, Math.ceil(len / PAGE) - 1))
  const pw = clamp(st.pageW, fw.length)
  const pt = clamp(st.pageT, ft.length)
  const pagedW = fw.slice(pw * PAGE, pw * PAGE + PAGE)
  const pagedT = ft.slice(pt * PAGE, pt * PAGE + PAGE)
  const pageLabel = (len: number, page: number) =>
    len === 0
      ? '0'
      : Math.min(len, clamp(page, len) * PAGE + 1) +
        '–' +
        Math.min(len, clamp(page, len) * PAGE + PAGE) +
        ' из ' +
        len

  const qs = st.qShop.trim().toLowerCase()
  const sKey = (w: Worker) =>
    st.sortS === 'last' ? lastOf(w) : st.sortS === 'load' ? activeOf(w.id) : w.name
  const shopList = shopWorkers
    .filter((w) => !qs || (w.name + ' ' + lastOf(w)).toLowerCase().indexOf(qs) !== -1)
    .slice()
    .sort((a, b) => st.dirS * cmp(sKey(a), sKey(b)))
  const sArrow = (key: string) => (st.sortS === key ? (st.dirS > 0 ? '↑' : '↓') : '')
  const setSortS = (key: State['sortS']) =>
    setState({ sortS: key, dirS: st.sortS === key ? -st.dirS : 1 })

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
    loading: st.loading,
    notLoading: !st.loading,
    errorOpen: !!st.error,
    errorText: st.error || '',
    retry: () => load(),
    offline: st.online === false,
    skeletonRows: [1, 2, 3, 4, 5, 6],
    onSortKeyName: keyActivate(() => setSort('w', 'name')),
    onSortKeyShop: keyActivate(() => setSort('w', 'shop')),
    onSortKeyLast: keyActivate(() => setSort('w', 'last')),
    onSortKeyLoad: keyActivate(() => setSort('w', 'load')),
    onSortKeyTTitle: keyActivate(() => setSort('t', 'title')),
    onSortKeyTWorker: keyActivate(() => setSort('t', 'worker')),
    onSortKeyTShop: keyActivate(() => setSort('t', 'shop')),
    onSortKeyTStatus: keyActivate(() => setSort('t', 'status')),
    nWorkers: nf.format(st.workers.length),
    nTasks: nf.format(st.tasks.length),
    nShops: nf.format(st.shops.length),
    notAuthed: !st.authed,
    login: st.login,
    pass: st.pass,
    authErr: st.authErr,
    authBtn: st.authBusy ? 'Проверка…' : 'Войти',
    setLogin: (e: ChangeEvent<HTMLInputElement>) =>
      setState({ login: e.target.value, authErr: '' }),
    setPass: (e: ChangeEvent<HTMLInputElement>) => setState({ pass: e.target.value, authErr: '' }),
    submitLogin: (e: { preventDefault: () => void }) => {
      e.preventDefault()
      const l = st.login.trim()
      const p = st.pass
      if (!l || !p) return setState({ authErr: 'Заполните логин и пароль' })
      setState({ authBusy: true })
      setTimeout(() => {
        if (l.toLowerCase() === 'master' && p === '1234') {
          setState({ authed: true, authBusy: false, pass: '', authErr: '' })
        } else {
          setState({ authBusy: false, authErr: 'Неверный логин или пароль' })
        }
      }, 450)
    },
    logout: () => setState({ authed: false, pass: '', authErr: '' }),
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
    countShops: st.shops.length,
    countWorkers: st.workers.length,
    countTasks: st.tasks.length,
    countInWork: st.tasks.filter((t) => t.status === 'В работе').length,
    countNew: st.tasks.filter((t) => t.status === 'Новая').length,
    countDone: st.tasks.filter((t) => t.status === 'Выполнено').length,
    pctInWork: pct(st.tasks.filter((t) => t.status === 'В работе').length),
    pctNew: pct(st.tasks.filter((t) => t.status === 'Новая').length),
    pctDone: pct(st.tasks.filter((t) => t.status === 'Выполнено').length),

    shopRows: st.shops.map((s): ShopRow => {
      const ws = st.workers.filter((w) => w.shopId === s.id)
      const acts = ws.map((w) => activeOf(w.id))
      const max = Math.max(1, ...acts)
      return {
        num: s.num,
        name: s.name,
        workers: ws.length,
        active: acts.reduce((a, b) => a + b, 0),
        done: ws.reduce((a, w) => a + doneOf(w.id), 0),
        bars: acts.slice(0, 5).map((v) => ({
          h: Math.max(4, Math.round((26 * v) / max)) + 'px',
          c: v === max && v > 0 ? 'var(--accent)' : 'rgba(var(--accent-rgb),.35)',
        })),
        open: () => navigate('/shops/' + s.id),
        edit: () => openModal({ kind: 'shop', id: s.id, name: s.name, num: s.num }),
        del: () => askDelete({ kind: 'shop', id: s.id, label: shopLabel(s) }),
      }
    }),

    shopTitle: cur ? 'Цех №' + cur.num : 'Цех',
    shopMeta: cur ? cur.name + ' · рабочих ' + shopWorkers.length : '',
    shopWorkerRows: shopList.map(workerRow),
    shopEmpty: shopWorkers.length === 0,
    shopSearchEmpty: shopWorkers.length > 0 && shopList.length === 0,
    qShop: st.qShop,
    onQShop: (e: ChangeEvent<HTMLInputElement>) => setState({ qShop: e.target.value }),
    shopFound: shopList.length,
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
      setState({ selW: [] })
    },
    moveShopOptions: ([{ value: '', label: 'Перевести в цех…' }] as Option[]).concat(
      st.shops.map((s) => ({ value: String(s.id), label: shopLabel(s) })),
    ),
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
    dropShops: st.shops.map(
      (s): DropShop => ({
        label: shopLabel(s),
        count: st.workers.filter((w) => w.shopId === s.id).length,
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
          setState({ selW: [] })
        },
      }),
    ),
    editShop: () =>
      cur && openModal({ kind: 'shop', id: cur.id, name: cur.name, num: cur.num }),
    addShop: () => openModal({ kind: 'shop', name: '', num: '' }),
    addWorker: () => openModal({ kind: 'worker', name: '', shopId: route.shopId }),
    addWorkerAny: () => openModal({ kind: 'worker', name: '', shopId: st.shops[0]?.id }),

    workerName: curW ? curW.name : 'Рабочий',
    workerShop: curW ? shopLabel(shop(curW.shopId)) : '—',
    workerMeta: curW ? 'активных ' + activeOf(curW.id) + ' · выполнено ' + doneOf(curW.id) : '',
    workerTaskRows: curW ? tasksOf(curW.id).map(taskRow) : [],
    workerEmpty: curW ? tasksOf(curW.id).length === 0 : false,
    backToShop: () => navigate(curW ? '/shops/' + curW.shopId : '/shops'),
    editWorker: () =>
      curW && openModal({ kind: 'worker', id: curW.id, name: curW.name, shopId: curW.shopId }),
    addTask: () =>
      openModal({ kind: 'task', name: '', workerId: route.workerId, status: defStatus }),
    addTaskAny: () =>
      openModal({ kind: 'task', name: '', workerId: st.workers[0]?.id, status: defStatus }),

    q: st.q,
    onQ: (e: ChangeEvent<HTMLInputElement>) =>
      setState({ q: e.target.value, pageW: 0, pageT: 0 }),
    fShopFilter: st.fShop,
    onShopFilter: (e: ChangeEvent<HTMLSelectElement>) =>
      setState({ fShop: e.target.value, pageW: 0, pageT: 0 }),
    fStatusFilter: st.fStatus,
    onStatusFilter: (e: ChangeEvent<HTMLSelectElement>) =>
      setState({ fStatus: e.target.value, pageT: 0 }),
    fWorkerFilter: st.fWorker,
    onWorkerFilter: (e: ChangeEvent<HTMLSelectElement>) =>
      setState({ fWorker: e.target.value, pageT: 0 }),
    shopFilterOptions: ([{ value: '', label: 'Все цеха' }] as Option[]).concat(
      st.shops.map((s) => ({ value: String(s.id), label: 'Цех №' + s.num + ' · ' + s.name })),
    ),
    statusFilterOptions: ([{ value: '', label: 'Все статусы' }] as Option[]).concat(
      STATUSES.map((s) => ({ value: s, label: s })),
    ),
    workerFilterOptions: ([{ value: '', label: 'Все рабочие' }] as Option[]).concat(
      st.workers.map((w) => ({ value: String(w.id), label: w.name })),
    ),
    filtersOn: !!(st.q || st.fShop || st.fStatus || st.fWorker),
    resetFilters: () =>
      setState({ q: '', fShop: '', fStatus: '', fWorker: '', pageW: 0, pageT: 0 }),

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

    allWorkerRows: pagedW.map(workerRow),
    workersFound: fw.length,
    workersEmpty: fw.length === 0,
    workerPageLabel: pageLabel(fw.length, st.pageW),
    workerPageOn: fw.length > PAGE,
    prevWorkerPage: () => setState({ pageW: Math.max(0, st.pageW - 1) }),
    nextWorkerPage: () =>
      setState({ pageW: Math.min(Math.ceil(fw.length / PAGE) - 1, st.pageW + 1) }),

    allTaskRows: pagedT.map(taskRow),
    tasksFound: ft.length,
    tasksEmptyAll: ft.length === 0,
    taskPageLabel: pageLabel(ft.length, st.pageT),
    taskPageOn: ft.length > PAGE,
    prevTaskPage: () => setState({ pageT: Math.max(0, st.pageT - 1) }),
    nextTaskPage: () =>
      setState({ pageT: Math.min(Math.ceil(ft.length / PAGE) - 1, st.pageT + 1) }),

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
    shopOptions: st.shops.map(
      (s: Shop): Option => ({ value: String(s.id), label: 'Цех №' + s.num + ' — ' + s.name }),
    ),
    showWorkerSelect: !!m && m.kind === 'task',
    fWorker: m && m.workerId != null ? String(m.workerId) : '',
    onWorker: field('workerId' as keyof Modal),
    workerOptions: st.workers.map(
      (w: Worker): Option => ({
        value: String(w.id),
        label: w.name + ' · ' + shopLabel(shop(w.shopId)),
      }),
    ),
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
