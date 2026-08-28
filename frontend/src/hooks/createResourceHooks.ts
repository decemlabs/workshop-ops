/**
 * Фабрика react-query хуков для CRUD-ресурса.
 *
 * Все три сущности (цеха, рабочие, задачи) ходят в одинаковые эндпоинты DRF,
 * поэтому список/деталь/мутации описаны один раз, а специфика (например,
 * сводка по задачам) добавляется в конкретном файле хуков.
 */

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { Resource } from '@/api/resources'
import type { BulkIdsInput, Paginated } from '@/api/types'

interface QueryOptions {
  enabled?: boolean
}

export function createResourceHooks<T, TInput, TParams extends object>(
  resource: Resource<T, TInput, TParams>,
  scope: string,
) {
  const keys = {
    /** Корень: инвалидация этого ключа сбрасывает и списки, и детали ресурса. */
    all: [scope] as const,
    lists: () => [scope, 'list'] as const,
    list: (params?: TParams) => [scope, 'list', params ?? {}] as const,
    details: () => [scope, 'detail'] as const,
    detail: (id: number) => [scope, 'detail', id] as const,
  }

  function useList(params?: TParams, options?: QueryOptions) {
    return useQuery({
      queryKey: keys.list(params),
      queryFn: ({ signal }) => resource.list(params, signal),
      // При смене страницы/фильтра держим прошлые данные, чтобы таблица не мигала.
      placeholderData: keepPreviousData,
      enabled: options?.enabled,
    })
  }

  function useDetail(id: number | undefined, options?: QueryOptions) {
    return useQuery({
      queryKey: keys.detail(id!),
      queryFn: ({ signal }) => resource.get(id!, signal),
      enabled: (options?.enabled ?? true) && id !== undefined,
    })
  }

  function useCreate() {
    const invalidateAll = useInvalidateData()

    return useMutation({
      mutationFn: (payload: TInput) => resource.create(payload),
      onSuccess: invalidateAll,
    })
  }

  function useUpdate() {
    const invalidateAll = useInvalidateData()

    return useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: Partial<TInput> }) =>
        resource.update(id, payload),
      onSuccess: invalidateAll,
    })
  }

  function useRemove() {
    const invalidateAll = useInvalidateData()

    return useMutation({
      mutationFn: (id: number) => resource.remove(id),
      onSuccess: invalidateAll,
    })
  }

  function useBulkDelete() {
    const invalidateAll = useInvalidateData()

    return useMutation({
      mutationFn: (payload: BulkIdsInput) => resource.bulkDelete(payload),
      onSuccess: invalidateAll,
    })
  }

  function useRestore() {
    const invalidateAll = useInvalidateData()

    return useMutation({
      mutationFn: (payload: BulkIdsInput) => resource.restore(payload),
      onSuccess: invalidateAll,
    })
  }

  return { keys, useList, useDetail, useCreate, useUpdate, useRemove, useBulkDelete, useRestore }
}

/**
 * Инвалидация после мутации — по всему кэшу данных, а не по своему скоупу.
 *
 * Счётчики связаны: новая задача меняет загрузку рабочего и агрегаты цеха,
 * удаление цеха каскадом гасит рабочих и задачи, restore поднимает всю партию.
 * Точечная инвалидация оставила бы соседний список с прежними числами.
 * Сессия (scope 'auth') от мутаций не меняется, поэтому её не трогаем.
 */
export function useInvalidateData() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'auth' })
}

/** Пустой ответ списка — удобно как значение по умолчанию, пока данные грузятся. */
export const EMPTY_PAGE: Paginated<never> = {
  count: 0,
  next: null,
  previous: null,
  results: [],
}
