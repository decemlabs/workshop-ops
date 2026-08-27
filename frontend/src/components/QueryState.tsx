import type { ReactNode } from 'react'

import { ApiError } from '@/api/client'

interface QueryStateProps {
  isPending: boolean
  error: unknown
  children: ReactNode
}

/**
 * Единая обёртка над загрузкой/ошибкой запроса, чтобы не повторять
 * ветвления на каждой странице. Разметку заменим на шаблонную.
 */
export function QueryState({ isPending, error, children }: QueryStateProps) {
  if (isPending) {
    return <p className="state state--loading">Загрузка…</p>
  }

  if (error) {
    const message =
      error instanceof ApiError && error.isUnauthorized
        ? 'Нужно войти: API отдаёт данные только авторизованным.'
        : error instanceof Error
          ? error.message
          : 'Неизвестная ошибка'

    return <p className="state state--error">{message}</p>
  }

  return <>{children}</>
}
