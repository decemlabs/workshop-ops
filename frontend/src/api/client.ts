/**
 * Тонкая обёртка над fetch для REST API.
 *
 * В разработке запросы идут на относительный /api — дев-сервер Vite проксирует
 * их на Django (см. vite.config.ts), поэтому сессионная кука и CSRF работают
 * как на одном origin.
 */

const API_URL: string = import.meta.env.VITE_API_URL ?? '/api'

/** Методы, для которых Django требует заголовок X-CSRFToken. */
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/** Ошибка ответа API: несёт статус и разобранное тело DRF. */
export class ApiError extends Error {
  readonly status: number
  readonly data: unknown

  constructor(status: number, data: unknown, message?: string) {
    super(message ?? `Ошибка запроса (${status})`)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }

  /** Пользователь не авторизован — DRF отдаёт 401/403 при IsAuthenticated. */
  get isUnauthorized(): boolean {
    return this.status === 401 || this.status === 403
  }

  /**
   * Ошибки валидации по полям: {"worker": ["Рабочий «X» больше не работает."]}.
   * Общие ошибки формы лежат под ключом non_field_errors.
   */
  get fieldErrors(): Record<string, string[]> {
    if (this.status !== 400 || !isRecord(this.data)) {
      return {}
    }

    const errors: Record<string, string[]> = {}
    for (const [field, value] of Object.entries(this.data)) {
      errors[field] = Array.isArray(value) ? value.map(String) : [String(value)]
    }
    return errors
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Достаёт человекочитаемое сообщение из тела ответа DRF.
 *
 * Строковое тело в сообщение не берём: DRF отвечает словарём или 204, а строкой приходит
 * чужая HTML-страница — трейсбек Django при DEBUG или ответ прокси. Сырое тело
 * остаётся в ApiError.data.
 */
function extractMessage(status: number, data: unknown): string {
  if (isRecord(data)) {
    const detail = data.detail
    if (typeof detail === 'string') {
      return detail
    }

    const first = Object.values(data)[0]
    if (Array.isArray(first) && first.length > 0) {
      return String(first[0])
    }
  }

  // 5xx приходит и от самого Django, и от прокси, когда бэк не поднят.
  return status >= 500 ? `Сервер не отвечает (${status})` : `Ошибка запроса (${status})`
}

/**
 * Читает CSRF-токен из куки.
 *
 * Django ставит csrftoken при любом ответе, который прошёл через CsrfViewMiddleware
 * с вызовом get_token() — например, после захода на /api-auth/login/ или в админку.
 * Если куки нет, изменяющий запрос вернёт 403 — это ожидаемо до логина.
 */
function getCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

/** Собирает query-строку, выбрасывая пустые значения. */
function buildQuery(params?: Record<string, unknown>): string {
  if (!params) {
    return ''
  }

  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value))
    }
  }

  const query = search.toString()
  return query ? `?${query}` : ''
}

interface RequestOptions {
  method?: string
  /** Тело запроса; сериализуется в JSON. */
  body?: unknown
  params?: Record<string, unknown>
  signal?: AbortSignal
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params, signal } = options
  const headers = new Headers({ Accept: 'application/json' })

  if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (UNSAFE_METHODS.has(method)) {
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      headers.set('X-CSRFToken', csrfToken)
    }
  }

  const response = await fetch(`${API_URL}${path}${buildQuery(params)}`, {
    method,
    headers,
    signal,
    credentials: 'include',
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  // 204 No Content отдаёт DELETE — тела нет.
  const data = response.status === 204 ? null : await parseBody(response)

  if (!response.ok) {
    throw new ApiError(response.status, data, extractMessage(response.status, data))
  }

  return data as T
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    // HTML-страница ошибки Django или ответ прокси — отдаём как есть.
    return text
  }
}

export const api = {
  get: <T>(path: string, params?: Record<string, unknown>, signal?: AbortSignal) =>
    request<T>(path, { params, signal }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: (path: string) => request<null>(path, { method: 'DELETE' }),
}
