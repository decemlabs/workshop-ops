import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitForElementToBeRemoved } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { expect, test } from 'vitest'

import type { Workshop } from '@/api/types'
import { Root } from '@/ui/Root'
import { mockFetch, page, reply } from '@/test/mockFetch'

const SHOP: Workshop = {
  id: 1,
  number: 10,
  name: 'Механический',
  is_active: true,
  workers_count: 3,
  active_tasks: 5,
  done_tasks: 2,
  workers_load: [],
  created_at: '2026-08-01T10:00:00Z',
  updated_at: '2026-08-01T10:00:00Z',
}

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/workshops']}>{children}</MemoryRouter>
    </QueryClientProvider>
  )

  return render(<Root />, { wrapper })
}

test('без сессии показывается форма входа', async () => {
  mockFetch({ '/api/auth/me/': reply(403, { detail: 'Учетные данные не были предоставлены.' }) })

  renderApp()

  // Ждём конца проверки сессии: форма должна стоять после ответа сервера, а не только вместо скелетона.
  await waitForElementToBeRemoved(() => screen.queryByRole('status'))
  expect(screen.getByText('Вход в систему')).toBeDefined()
})

test('после входа цеха приходят карточками', async () => {
  mockFetch({
    '/api/auth/me/': { id: 1, username: 'master', name: 'Мастер' },
    '/api/workshops/': page([SHOP]),
    '/api/workers/': page([]),
    '/api/tasks/summary/': { total: 7, by_status: [{ status: 'new', label: 'новая', count: 7 }] },
  })

  renderApp()

  expect(await screen.findByText('Механический')).toBeDefined()
  expect(screen.getByText('всего цехов 1 · рабочих 0 · задач 7')).toBeDefined()
  expect(screen.getByRole('button', { name: 'Открыть' })).toBeDefined()
  expect(screen.queryByText('Вход в систему')).toBeNull()
})
