/** Подмена fetch для тестов: ответы по началу пути, без единого сетевого запроса. */

import { vi } from 'vitest'

import type { Paginated } from '@/api/types'

interface Reply {
  status: number
  /** Строка уходит телом как есть (HTML-страница ошибки), объект — сериализуется. */
  body?: unknown
}

interface Call {
  url: string
  init: RequestInit
}

/** Ответ с нестандартным статусом: reply(403, { detail: '…' }). */
export const reply = (status: number, body?: unknown): Reply => ({ status, body })

/** Страница DRF из готовых строк. */
export const page = <T>(results: T[]): Paginated<T> => ({
  count: results.length,
  next: null,
  previous: null,
  results,
})

function isReply(value: unknown): value is Reply {
  return typeof value === 'object' && value !== null && 'status' in value
}

function toText(body: unknown): string {
  if (body === undefined || body === null) return ''
  return typeof body === 'string' ? body : JSON.stringify(body)
}

/**
 * routes: путь без query → тело ответа либо reply(status, body).
 * Незнакомый путь отвечает 404 — тест падает на нём, а не виснет.
 */
export function mockFetch(routes: Record<string, unknown>) {
  const calls: Call[] = []

  vi.stubGlobal(
    'fetch',
    vi.fn((input: string, init: RequestInit = {}) => {
      const url = String(input)
      calls.push({ url, init })

      const path = url.split('?')[0]
      const key = Object.keys(routes).find((route) => path.startsWith(route))
      const route = key === undefined ? reply(404, { detail: `Нет мока для ${path}` }) : routes[key]
      const { status, body } = isReply(route) ? route : reply(200, route)

      return Promise.resolve({
        ok: status < 400,
        status,
        text: () => Promise.resolve(toText(body)),
      } as Response)
    }),
  )

  return {
    calls,
    /** Query запросов к пути: сравнивать строкой нельзя — кириллица в ней процентится. */
    queries(prefix: string): URLSearchParams[] {
      return calls
        .filter((call) => call.url.startsWith(prefix))
        .map((call) => new URL(call.url, 'http://test').searchParams)
    },
  }
}
