import { Navigate, useLocation } from 'react-router'

import { AppModelProvider } from '@/model/AppModelProvider'
import { parseRoute } from '@/model/useAppModel'

import { AppShell } from './AppShell'

/**
 * Экраны прототипа разложены по адресам: /workshops, /workshops/:id, /workers, /workers/:id, /tasks.
 * Своего экрана 404 в дизайне нет, поэтому неизвестный адрес ведёт на /workshops.
 */
export function Root() {
  const { pathname } = useLocation()

  if (!parseRoute(pathname)) {
    return <Navigate to="/workshops" replace />
  }

  return (
    <AppModelProvider>
      <AppShell />
    </AppModelProvider>
  )
}
