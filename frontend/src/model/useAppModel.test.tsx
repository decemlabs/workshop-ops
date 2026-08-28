import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { expect, test } from 'vitest'

import { mockFetch, page } from '@/test/mockFetch'
import { parseRoute, useAppModel } from './useAppModel'

test('адрес разбирается в экран и идентификатор', () => {
  expect(parseRoute('/workshops')).toEqual({ view: 'shops', shopId: 0, workerId: 0 })
  expect(parseRoute('/workshops/3')).toEqual({ view: 'shop', shopId: 3, workerId: 0 })
  expect(parseRoute('/workers')).toEqual({ view: 'workers', shopId: 0, workerId: 0 })
  expect(parseRoute('/workers/2')).toEqual({ view: 'worker', shopId: 0, workerId: 2 })
  expect(parseRoute('/tasks')).toEqual({ view: 'tasks', shopId: 0, workerId: 0 })
  expect(parseRoute('/')).toBeNull()
  expect(parseRoute('/workshops/abc')).toBeNull()
})

test('фильтры, сортировка и страница уходят запросом на сервер', async () => {
  const fetch = mockFetch({
    '/api/auth/me/': { id: 1, username: 'master', name: 'Мастер' },
    '/api/workshops/': page([]),
    '/api/workers/': page([]),
    '/api/tasks/summary/': { total: 0, by_status: [] },
    '/api/tasks/': page([]),
  })

  // Свой клиент на тест: синглтон из app/queryClient держал бы кэш между тестами.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/workers']}>{children}</MemoryRouter>
    </QueryClientProvider>
  )

  const { result } = renderHook(() => useAppModel(), { wrapper })
  await waitFor(() => expect(result.current.data.authed).toBe(true))

  act(() =>
    result.current.setState({ q: 'Иван', fShop: '2', sortW: 'load', dirW: -1, pageW: 2 }),
  )

  await waitFor(() => {
    // Справочник рабочих для селектов ходит тем же путём — берём запрос с поиском.
    const query = fetch.queries('/api/workers/').findLast((q) => q.has('search'))
    expect(Object.fromEntries(query ?? [])).toEqual({
      search: 'Иван',
      workshop: '2',
      ordering: '-active_tasks',
      page: '2',
      page_size: '12',
    })
  })
})
