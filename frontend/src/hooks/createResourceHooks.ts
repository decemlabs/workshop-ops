/**
 * Фабрика react-query хуков для CRUD-ресурса.
 *
 * Все три сущности (цеха, рабочие, задачи) ходят в одинаковые эндпоинты DRF,
 * поэтому список/деталь/мутации описаны один раз, а специфика (например,
 * сводка по задачам) добавляется в конкретном файле хуков.
 */

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { Resource } from '@/api/resources'
import type { Paginated } from '@/api/types'

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
    const queryClient = useQueryClient()

    return useMutation({
      mutationFn: (payload: TInput) => resource.create(payload),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all }),
    })
  }

  function useUpdate() {
    const queryClient = useQueryClient()

    return useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: Partial<TInput> }) =>
        resource.update(id, payload),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all }),
    })
  }

  function useRemove() {
    const queryClient = useQueryClient()

    return useMutation({
      mutationFn: (id: number) => resource.remove(id),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all }),
    })
  }

  return { keys, useList, useDetail, useCreate, useUpdate, useRemove }
}

/** Пустой ответ списка — удобно как значение по умолчанию, пока данные грузятся. */
export const EMPTY_PAGE: Paginated<never> = {
  count: 0,
  next: null,
  previous: null,
  results: [],
}
