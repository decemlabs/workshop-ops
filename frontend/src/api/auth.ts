/** Сессионная авторизация Django: backend/src/apps/users/views.py. */

import { api } from './client'
import type { LoginInput, User } from './types'

export const authApi = {
  /**
   * Текущий пользователь. 403 означает «не вошёл», а не сбой.
   *
   * На MeView висит ensure_csrf_cookie, поэтому этот запрос ставит csrftoken
   * даже при 403 — без него csrf_protect отклонит логин. Значит, me() идёт первым.
   */
  me: (signal?: AbortSignal) => api.get<User>('/auth/me/', undefined, signal),

  login: (payload: LoginInput) => api.post<User>('/auth/login/', payload),

  logout: () => api.post<null>('/auth/logout/'),
}
