/**
 * Порт класса DCLogic из прототипа: состояние и действия.
 *
 * Имена методов и порядок операций сохранены, чтобы код сверялся с оригиналом
 * построчно. Отличие одно: view/shopId/workerId живут в адресе, а не в state,
 * поэтому вместо setState({ view }) вызывается navigate().
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { INITIAL_STATE, STATUSES } from './mock'
import { SETTINGS } from './settings'
import type { Confirm, Modal, Shop, State, Status, Task, Undo, Worker } from './types'

export type View = 'shops' | 'shop' | 'worker' | 'workers' | 'tasks'

interface Route {
  view: View
  shopId: number
  workerId: number
}

/** Разбирает адрес в view + идентификаторы: /shops, /shops/3, /workers, /workers/2, /tasks. */
export function parseRoute(pathname: string): Route | null {
  const m = /^\/(shops|workers|tasks)(?:\/(\d+))?\/?$/.exec(pathname)
  if (!m) return null

  const id = m[2] ? Number(m[2]) : 0
  if (m[1] === 'shops') return { view: id ? 'shop' : 'shops', shopId: id, workerId: 0 }
  if (m[1] === 'workers') return { view: id ? 'worker' : 'workers', shopId: 0, workerId: id }
  return { view: 'tasks', shopId: 0, workerId: 0 }
}

export function useAppModel() {
  // online берём сразу из навигатора: в оригинале это делал setState на маунте.
  const [st, setSt] = useState<State>(() => ({ ...INITIAL_STATE, online: navigator.onLine }))
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const route = parseRoute(pathname) ?? { view: 'shops' as View, shopId: 0, workerId: 0 }
  const { view } = route

  // Слушатели вешаются один раз, но читают свежее состояние — как this.state в классе.
  const stRef = useRef(st)
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dragIds = useRef<number[] | null>(null)

  const setState = useCallback((patch: Partial<State>) => {
    setSt((prev) => ({ ...prev, ...patch }))
  }, [])

  useEffect(() => {
    stRef.current = st
  })

  const load = useCallback(() => {
    setState({ loading: true, error: null })
    if (loadTimer.current) clearTimeout(loadTimer.current)
    loadTimer.current = setTimeout(() => setState({ loading: false }), 900)
  }, [setState])

  useEffect(() => {
    // Стартовая загрузка: loading/error уже в нужном состоянии, поэтому только взводим таймер.
    if (loadTimer.current) clearTimeout(loadTimer.current)
    loadTimer.current = setTimeout(() => setState({ loading: false }), 900)

    const onEsc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (stRef.current.confirm) setState({ confirm: null })
      else if (stRef.current.modal) setState({ modal: null })
    }
    const onNet = () => setState({ online: navigator.onLine })

    window.addEventListener('keydown', onEsc)
    window.addEventListener('online', onNet)
    window.addEventListener('offline', onNet)

    return () => {
      window.removeEventListener('keydown', onEsc)
      window.removeEventListener('online', onNet)
      window.removeEventListener('offline', onNet)
      if (undoTimer.current) clearTimeout(undoTimer.current)
      if (loadTimer.current) clearTimeout(loadTimer.current)
    }
  }, [setState])

  const api = useMemo(() => {
    const keyActivate = (fn: () => void) => (e: { key: string; preventDefault: () => void }) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        fn()
      }
    }
    const nextId = () => {
      const id = st.seq + 1
      setState({ seq: id })
      return id
    }
    const shop = (id: number) => st.shops.find((s) => s.id === id)
    const worker = (id: number) => st.workers.find((w) => w.id === id)
    const shopLabel = (s: Shop | undefined) => (s ? 'Цех №' + s.num + ' · ' + s.name : '—')
    const tasksOf = (id: number) => st.tasks.filter((t) => t.workerId === id)
    const activeOf = (id: number) => tasksOf(id).filter((t) => t.status !== 'Выполнено').length
    const doneOf = (id: number) => tasksOf(id).filter((t) => t.status === 'Выполнено').length
    const code = (t: Task) => 'ЗН-' + String(4800 + t.id)

    const openModal = (m: Modal) => setState({ modal: m })

    const snapshot = (label: string): Undo => {
      if (undoTimer.current) clearTimeout(undoTimer.current)
      undoTimer.current = setTimeout(() => setState({ undo: null }), 9000)
      return { label, shops: st.shops, workers: st.workers, tasks: st.tasks, path: pathname }
    }

    const remove = (c: Confirm) => {
      const undo = snapshot(
        c.kind === 'shop'
          ? 'Цех «' + c.label + '» удалён'
          : c.kind === 'worker'
            ? 'Рабочий «' + c.label + '» удалён'
            : 'Задача «' + c.label + '» удалена',
      )
      setState({ undo })

      if (c.kind === 'shop') {
        const ids = st.workers.filter((w) => w.shopId === c.id).map((w) => w.id)
        setState({
          shops: st.shops.filter((s) => s.id !== c.id),
          workers: st.workers.filter((w) => w.shopId !== c.id),
          tasks: st.tasks.filter((t) => ids.indexOf(t.workerId) === -1),
          confirm: null,
        })
        if (view === 'shop' && route.shopId === c.id) navigate('/shops')
      } else if (c.kind === 'worker') {
        setState({
          workers: st.workers.filter((w) => w.id !== c.id),
          tasks: st.tasks.filter((t) => t.workerId !== c.id),
          confirm: null,
        })
        if (view === 'worker' && route.workerId === c.id) {
          const w = worker(c.id)
          navigate(w ? '/shops/' + w.shopId : '/shops')
        }
      } else {
        setState({ tasks: st.tasks.filter((t) => t.id !== c.id), confirm: null })
      }
    }

    const askDelete = (c: Confirm) => {
      if (SETTINGS.confirmDelete === false) {
        remove(c)
        return
      }
      setState({ confirm: c })
    }

    const undoDelete = () => {
      const u = st.undo
      if (!u) return
      if (undoTimer.current) clearTimeout(undoTimer.current)
      setState({ shops: u.shops, workers: u.workers, tasks: u.tasks, undo: null })
      navigate(u.path)
    }

    const setSort = (list: 'w' | 't', key: string) => {
      if (list === 'w') {
        const same = st.sortW === key
        setState({ sortW: key as State['sortW'], dirW: same ? -st.dirW : 1, pageW: 0 })
      } else {
        const same = st.sortT === key
        setState({ sortT: key as State['sortT'], dirT: same ? -st.dirT : 1, pageT: 0 })
      }
    }

    const toggleSel = (list: 'w' | 't', id: number) => {
      const k = list === 'w' ? 'selW' : 'selT'
      const cur = st[k]
      setState({
        [k]: cur.indexOf(id) === -1 ? cur.concat([id]) : cur.filter((x) => x !== id),
      } as Partial<State>)
    }

    const bulkDelete = (list: 'w' | 't') => {
      if (list === 'w') {
        const ids = st.selW
        if (!ids.length) return
        const undo = snapshot('Удалено рабочих: ' + ids.length)
        setState({
          undo,
          selW: [],
          workers: st.workers.filter((w) => ids.indexOf(w.id) === -1),
          tasks: st.tasks.filter((t) => ids.indexOf(t.workerId) === -1),
        })
      } else {
        const ids = st.selT
        if (!ids.length) return
        const undo = snapshot('Удалено задач: ' + ids.length)
        setState({ undo, selT: [], tasks: st.tasks.filter((t) => ids.indexOf(t.id) === -1) })
      }
    }

    const bulkStatus = (status: Status) => {
      const ids = st.selT
      if (!ids.length || !status) return
      const undo = snapshot('Статус изменён у задач: ' + ids.length)
      setState({
        undo,
        tasks: st.tasks.map((t) => (ids.indexOf(t.id) === -1 ? t : { ...t, status })),
      })
    }

    const moveWorkers = (ids: number[], shopId: number) => {
      if (!ids.length) return
      const s = shop(shopId)
      const undo = snapshot(
        ids.length === 1
          ? 'Рабочий переведён в ' + shopLabel(s)
          : 'Переведено рабочих: ' + ids.length,
      )
      setState({
        undo,
        dragOver: null,
        workers: st.workers.map((w) => (ids.indexOf(w.id) === -1 ? w : { ...w, shopId })),
      })
    }

    const save = () => {
      const m = st.modal
      if (!m) return
      const name = (m.name || '').trim()
      if (!name) {
        setState({
          modal: {
            ...m,
            err:
              m.kind === 'task'
                ? 'Введите название задачи'
                : m.kind === 'worker'
                  ? 'Введите имя рабочего'
                  : 'Введите название цеха',
          },
        })
        return
      }

      if (m.kind === 'shop') {
        const num = parseInt(String(m.num), 10) || 0
        if (m.id) {
          setState({
            shops: st.shops.map((s) => (s.id === m.id ? { ...s, name, num } : s)),
            modal: null,
          })
        } else {
          setState({ shops: st.shops.concat([{ id: nextId(), num, name }]), modal: null })
        }
      } else if (m.kind === 'worker') {
        const shopId = Number(m.shopId)
        if (m.id) {
          setState({
            workers: st.workers.map((w) => (w.id === m.id ? { ...w, name, shopId } : w)),
            modal: null,
          })
        } else {
          setState({ workers: st.workers.concat([{ id: nextId(), name, shopId }]), modal: null })
        }
      } else {
        const workerId = Number(m.workerId)
        const status = m.status as Status
        if (m.id) {
          setState({
            tasks: st.tasks.map((t) =>
              t.id === m.id ? { ...t, title: name, workerId, status } : t,
            ),
            modal: null,
          })
        } else {
          setState({
            tasks: st.tasks.concat([{ id: nextId(), title: name, workerId, status }]),
            modal: null,
          })
        }
      }
    }

    const field =
      (k: keyof Modal) => (e: { target: { value: string } }) =>
        setState({ modal: { ...(st.modal as Modal), [k]: e.target.value, err: '' } })

    return {
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
      remove,
    }
  }, [st, setState, navigate, pathname, view, route.shopId, route.workerId])

  return { st, setState, load, view, route, navigate, dragIds, ...api }
}

export type AppModel = ReturnType<typeof useAppModel>

/** Порядок статусов нужен сортировке задач — как STATUSES.indexOf в оригинале. */
export { STATUSES }
export type { Shop, Task, Worker }
