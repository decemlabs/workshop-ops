/** Сессионная авторизация: текущий пользователь, вход и выход. */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { authApi } from '@/api/auth'
import { ApiError } from '@/api/client'
import type { LoginInput } from '@/api/types'

export const authKeys = {
  me: ['auth', 'me'] as const,
}

/**
 * Текущий пользователь. 403 от IsAuthenticated — это «не вошёл», а не сбой,
 * поэтому повторов нет: ответ разбирает isUnauthenticated ниже.
 */
export function useMe() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: ({ signal }) => authApi.me(signal),
    retry: false,
    staleTime: Infinity,
  })
}

/** Отличает «нужен вход» от настоящей ошибки загрузки. */
export function isUnauthenticated(error: unknown): boolean {
  return error instanceof ApiError && error.isUnauthorized
}

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: LoginInput) => authApi.login(payload),
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me, user)
      return queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] !== 'auth' })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => authApi.logout(),
    // Чужие данные в кэше после выхода не нужны: сносим всё, включая me.
    onSuccess: () => queryClient.clear(),
  })
}
