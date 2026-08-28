/**
 * Состояние экрана и действия над данными.
 *
 * Порт класса DCLogic из прототипа: имена методов сохранены, но списки больше
 * не лежат в state — их отдаёт API, а react-query держит кэш. В state остаётся
 * только интерфейс: модалка, фильтры, сортировки, выбор, страница.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router'

import { ApiError } from '@/api/client'
import type { Task, TaskListParams, Worker, WorkerListParams, Workshop } from '@/api/types'
import { isUnauthenticated, useLogin, useLogout, useMe } from '@/hooks/useAuth'
import {
  useBulkDeleteTasks,
  useBulkTaskStatus,
  useCreateTask,
  useDeleteTask,
  useTasks,
  useTaskSummary,
  useUpdateTask,
} from '@/hooks/useTasks'
import {
  useBulkDeleteWorkers,
  useBulkMoveWorkers,
  useCreateWorker,
  useDeleteWorker,
  useUpdateWorker,
  useWorker,
  useWorkers,
} from '@/hooks/useWorkers'
import {
  useCreateWorkshop,
  useDeleteWorkshop,
  useUpdateWorkshop,
  useWorkshops,
} from '@/hooks/useWorkshops'

import { DICT_PAGE, INITIAL_STATE, PAGE, STATUSES } from './mock'
import { SETTINGS } from './settings'
import { STATUS_CODE } from './status'
import type { Confirm, Modal, State, Status } from './types'

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

/** Ключи сортировки экрана → поля ordering_fields вьюсетов. */
const WORKER_ORDERING: Record<State['sortW'], string> = {
  name: 'name',
  shop: 'workshop__number',
  last: 'last_task_title',
  load: 'active_tasks',
}

const TASK_ORDERING: Record<State['sortT'], string> = {
  title: 'title',
  worker: 'worker__name',
  shop: 'worker__workshop__number',
  status: 'status_order',
}

const SHOP_ORDERING: Record<State['sortS'], string> = {
  name: 'name',
  last: 'last_task_title',
  load: 'active_tasks',
}

const ordering = (field: string, dir: number) => (dir < 0 ? `-${field}` : field)

/** Пустая строка фильтра значит «все», числовые фильтры уходят числом. */
const num = (value: string): number | undefined => (value ? Number(value) : undefined)

/** Текст ошибки для баннера: DRF отдаёт detail либо словарь по полям. */
function errorText(error: unknown): string {
  if (error instanceof ApiError) {
    const [first] = Object.values(error.fieldErrors)
    return first?.[0] ?? error.message
  }
  return 'Не удалось выполнить запрос'
}

export function useAppModel() {
  // online берём сразу из навигатора: в оригинале это делал setState на маунте.
  const [st, setSt] = useState<State>(() => ({ ...INITIAL_STATE, online: navigator.onLine }))
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { pathname } = useLocation()

  const route = parseRoute(pathname) ?? { view: 'shops' as View, shopId: 0, workerId: 0 }
  const { view } = route

  // Слушатели вешаются один раз, но читают свежее состояние — как this.state в классе.
  const stRef = useRef(st)
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dragIds = useRef<number[] | null>(null)

  const setState = useCallback((patch: Partial<State>) => {
    setSt((prev) => ({ ...prev, ...patch }))
  }, [])

  useEffect(() => {
    stRef.current = st
  })

  useEffect(() => {
    // Таймер тоста живёт вне эффекта, поэтому в очистку берём сам ref, а не .current.
    const timer = undoTimer

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
      if (timer.current) clearTimeout(timer.current)
    }
  }, [setState])

  const me = useMe()
  const login = useLogin()
  const logoutMutation = useLogout()
  const authed = !!me.data
  const on = { enabled: authed }

  // Справочники: сайдбар, селекты, drop-зоны и карточки цехов. Списки короткие,
  // поэтому берём одной страницей; count в ответе всё равно общий.
  const workshops = useWorkshops({ ordering: 'number', page_size: DICT_PAGE }, on)
  const workersDict = useWorkers({ ordering: 'name', page_size: DICT_PAGE }, on)
  const summary = useTaskSummary(undefined, on)

  const workerParams: WorkerListParams = {
    search: st.q || undefined,
    workshop: num(st.fShop),
    ordering: ordering(WORKER_ORDERING[st.sortW], st.dirW),
    page: st.pageW,
    page_size: PAGE,
  }
  const workersPage = useWorkers(workerParams, { enabled: authed && view === 'workers' })

  const shopWorkers = useWorkers(
    {
      workshop: route.shopId,
      search: st.qShop || undefined,
      ordering: ordering(SHOP_ORDERING[st.sortS], st.dirS),
      page_size: DICT_PAGE,
    },
    { enabled: authed && view === 'shop' },
  )

  const workerDetail = useWorker(route.workerId || undefined, {
    enabled: authed && view === 'worker',
  })
  const workerTasks = useTasks(
    { worker: route.workerId, ordering: '-created_at', page_size: DICT_PAGE },
    { enabled: authed && view === 'worker' },
  )

  const taskParams: TaskListParams = {
    search: st.q || undefined,
    status: st.fStatus ? STATUS_CODE[st.fStatus as Status] : undefined,
    worker: num(st.fWorker),
    worker__workshop: num(st.fShop),
    ordering: ordering(TASK_ORDERING[st.sortT], st.dirT),
    page: st.pageT,
    page_size: PAGE,
  }
  const tasksPage = useTasks(taskParams, { enabled: authed && view === 'tasks' })

  const createWorkshop = useCreateWorkshop()
  const updateWorkshop = useUpdateWorkshop()
  const deleteWorkshop = useDeleteWorkshop()
  const createWorker = useCreateWorker()
  const updateWorker = useUpdateWorker()
  const deleteWorker = useDeleteWorker()
  const bulkDeleteWorkers = useBulkDeleteWorkers()
  const bulkMoveWorkers = useBulkMoveWorkers()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const bulkDeleteTasks = useBulkDeleteTasks()
  const bulkTaskStatus = useBulkTaskStatus()

  /** Запросы текущего экрана: по ним считаются скелетон и баннер ошибки. */
  const active = [workshops, workersDict, summary, workersPage, shopWorkers, workerDetail, workerTasks, tasksPage]
  const failed = active.find((query) => query.error)

  const load = useCallback(() => {
    setState({ actionErr: null })
    void queryClient.refetchQueries()
  }, [queryClient, setState])

  const api = useMemo(() => {
    const keyActivate = (fn: () => void) => (e: { key: string; preventDefault: () => void }) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        fn()
      }
    }

    const openModal = (m: Modal) => setState({ modal: m })

    /** Действие, ошибка которого уходит в баннер, а не ломает экран. */
    const run = async (fn: () => Promise<unknown>) => {
      try {
        await fn()
      } catch (error) {
        setState({ actionErr: errorText(error) })
      }
    }

    const remove = (c: Confirm) => {
      setState({ confirm: null })

      return run(async () => {
        if (c.kind === 'shop') {
          await deleteWorkshop.mutateAsync(c.id)
          if (view === 'shop' && route.shopId === c.id) navigate('/shops')
        } else if (c.kind === 'worker') {
          const shopId = workerDetail.data?.workshop
          await deleteWorker.mutateAsync(c.id)
          if (view === 'worker' && route.workerId === c.id) {
            navigate(shopId ? '/shops/' + shopId : '/shops')
          }
        } else {
          await deleteTask.mutateAsync(c.id)
        }
      })
    }

    const askDelete = (c: Confirm) => {
      if (SETTINGS.confirmDelete === false) {
        void remove(c)
        return
      }
      setState({ confirm: c })
    }

    const undoDelete = () => {
      const u = st.undo
      if (!u) return
      if (undoTimer.current) clearTimeout(undoTimer.current)
      setState({ undo: null })
      return run(u.run)
    }

    const setSort = (list: 'w' | 't', key: string) => {
      if (list === 'w') {
        const same = st.sortW === key
        setState({ sortW: key as State['sortW'], dirW: same ? -st.dirW : 1, pageW: 1 })
      } else {
        const same = st.sortT === key
        setState({ sortT: key as State['sortT'], dirT: same ? -st.dirT : 1, pageT: 1 })
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
      const ids = list === 'w' ? st.selW : st.selT
      if (!ids.length) return

      return run(async () => {
        if (list === 'w') {
          await bulkDeleteWorkers.mutateAsync({ ids })
          setState({ selW: [] })
        } else {
          await bulkDeleteTasks.mutateAsync({ ids })
          setState({ selT: [] })
        }
      })
    }

    const bulkStatus = (status: Status) => {
      const ids = st.selT
      if (!ids.length || !status) return

      return run(() => bulkTaskStatus.mutateAsync({ ids, status: STATUS_CODE[status] }))
    }

    const moveWorkers = (ids: number[], shopId: number) => {
      if (!ids.length || !shopId) return

      setState({ dragOver: null })
      return run(async () => {
        await bulkMoveWorkers.mutateAsync({ ids, workshop: shopId })
        setState({ selW: [] })
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

      const write = async () => {
        if (m.kind === 'shop') {
          const payload = { name, number: parseInt(String(m.num), 10) || 0 }
          await (m.id
            ? updateWorkshop.mutateAsync({ id: m.id, payload })
            : createWorkshop.mutateAsync(payload))
        } else if (m.kind === 'worker') {
          const payload = { name, workshop: Number(m.shopId) }
          await (m.id
            ? updateWorker.mutateAsync({ id: m.id, payload })
            : createWorker.mutateAsync(payload))
        } else {
          const payload = {
            title: name,
            worker: Number(m.workerId),
            status: STATUS_CODE[(m.status as Status) || STATUSES[0]],
          }
          await (m.id
            ? updateTask.mutateAsync({ id: m.id, payload })
            : createTask.mutateAsync(payload))
        }
      }

      // Ошибки валидации показываем в самой модалке — форма остаётся открытой.
      return write().then(
        () => setState({ modal: null }),
        (error: unknown) => setState({ modal: { ...m, err: errorText(error) } }),
      )
    }

    const field =
      (k: keyof Modal) => (e: { target: { value: string } }) =>
        setState({ modal: { ...(st.modal as Modal), [k]: e.target.value, err: '' } })

    const submitLogin = (e: { preventDefault: () => void }) => {
      e.preventDefault()
      const l = st.login.trim()
      const p = st.pass
      if (!l || !p) {
        setState({ authErr: 'Заполните логин и пароль' })
        return
      }

      login.mutate(
        { username: l, password: p },
        {
          onSuccess: () => setState({ pass: '', authErr: '' }),
          onError: (error) => setState({ authErr: errorText(error) }),
        },
      )
    }

    const logout = () =>
      logoutMutation.mutate(undefined, {
        onSuccess: () => setState({ ...INITIAL_STATE, online: navigator.onLine }),
      })

    return {
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
      remove,
      submitLogin,
      logout,
    }
  }, [
    st,
    setState,
    navigate,
    view,
    route.shopId,
    route.workerId,
    workerDetail.data,
    login,
    logoutMutation,
    createWorkshop,
    updateWorkshop,
    deleteWorkshop,
    createWorker,
    updateWorker,
    deleteWorker,
    bulkDeleteWorkers,
    bulkMoveWorkers,
    createTask,
    updateTask,
    deleteTask,
    bulkDeleteTasks,
    bulkTaskStatus,
  ])

  /** Данные для разметки: пустые списки, пока запрос не пришёл. */
  const data = {
    authed,
    authBusy: login.isPending || me.isLoading,
    // isLoading, а не isPending: выключенные до входа запросы «висят» в pending.
    loading: active.some((query) => query.isLoading),
    error: st.actionErr ?? (failed && !isUnauthenticated(failed.error) ? errorText(failed.error) : null),
    workshops: (workshops.data?.results ?? []) as Workshop[],
    shopsCount: workshops.data?.count ?? 0,
    workersDict: (workersDict.data?.results ?? []) as Worker[],
    workersCount: workersDict.data?.count ?? 0,
    summary: summary.data,
    workers: (workersPage.data?.results ?? []) as Worker[],
    workersFound: workersPage.data?.count ?? 0,
    shopWorkers: (shopWorkers.data?.results ?? []) as Worker[],
    worker: workerDetail.data,
    workerTasks: (workerTasks.data?.results ?? []) as Task[],
    tasks: (tasksPage.data?.results ?? []) as Task[],
    tasksFound: tasksPage.data?.count ?? 0,
  }

  return { st, setState, load, view, route, navigate, dragIds, data, ...api }
}

export type AppModel = ReturnType<typeof useAppModel>

/** Порядок статусов нужен фильтрам и селектам — как STATUSES.indexOf в оригинале. */
export { STATUSES }
