import { expect, test } from 'vitest'

import { mockFetch, reply } from '@/test/mockFetch'
import { ApiError, api } from './client'

/** Заголовки запроса — Headers собирает сам клиент. */
const headers = (init: RequestInit) => init.headers as Headers

/** Ошибка запроса: тест ждёт именно её, а не успешный ответ. */
async function failure(promise: Promise<unknown>): Promise<ApiError> {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  )
  expect(error).toBeInstanceOf(ApiError)
  return error as ApiError
}

test('пустые значения фильтров не уходят в query, а GET обходится без CSRF', async () => {
  const fetch = mockFetch({ '/api/workers/': { count: 0, next: null, previous: null, results: [] } })

  await api.get('/workers/', { search: '', workshop: 3, page: undefined })

  expect([...fetch.queries('/api/workers/')[0]]).toEqual([['workshop', '3']])
  expect(headers(fetch.calls[0].init).has('X-CSRFToken')).toBe(false)
})

test('изменяющий запрос подставляет csrftoken из куки', async () => {
  document.cookie = 'csrftoken=abc123'
  const fetch = mockFetch({ '/api/tasks/': { id: 1 } })

  await api.post('/tasks/', { title: 'Заменить фильтр' })

  expect(headers(fetch.calls[0].init).get('X-CSRFToken')).toBe('abc123')
})

test('DELETE с 204 возвращает null', async () => {
  mockFetch({ '/api/tasks/1/': reply(204) })

  expect(await api.delete('/tasks/1/')).toBeNull()
})

test('ошибку валидации DRF видно и по полям, и в сообщении', async () => {
  mockFetch({ '/api/tasks/': reply(400, { worker: ['Рабочий «Иванов» больше не работает.'] }) })

  const error = await failure(api.post('/tasks/', { title: 'Покрасить раму' }))

  expect(error.fieldErrors.worker[0]).toBe('Рабочий «Иванов» больше не работает.')
  expect(error.message).toBe('Рабочий «Иванов» больше не работает.')
})

test('403 — это «нужен вход», а молчащий сервер — сообщение о сбое', async () => {
  mockFetch({ '/api/auth/me/': reply(403, { detail: 'Учетные данные не были предоставлены.' }) })
  const denied = await failure(api.get('/auth/me/'))

  expect(denied.isUnauthorized).toBe(true)

  // Тела нет вовсе — так отвечает прокси, когда бэк не поднят.
  mockFetch({ '/api/workshops/': reply(500) })
  const down = await failure(api.get('/workshops/'))

  expect(down.isUnauthorized).toBe(false)
  expect(down.message).toBe('Сервер не отвечает (500)')
})

test('HTML-страница ошибки не уезжает в сообщение', async () => {
  // Трейсбек Django при DEBUG=True: тело есть, но показывать его пользователю нечего.
  const traceback = '<!DOCTYPE html><html><body><h1>IntegrityError at /api/tasks/</h1></body></html>'
  mockFetch({ '/api/tasks/': reply(500, traceback) })

  const error = await failure(api.get('/tasks/'))

  expect(error.message).toBe('Сервер не отвечает (500)')
  expect(error.data).toBe(traceback) // в девтулзах страница всё же под рукой
})
