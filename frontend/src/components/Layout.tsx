import { NavLink, Outlet } from 'react-router'

/** Каркас страниц: шапка с навигацией + область текущего маршрута. */
export function Layout() {
  return (
    <div className="layout">
      <header className="layout__header">
        <nav className="nav">
          <NavLink to="/workshops">Цеха</NavLink>
          <NavLink to="/workers">Рабочие</NavLink>
          <NavLink to="/tasks">Задачи</NavLink>
        </nav>
      </header>

      <main className="layout__main">
        <Outlet />
      </main>
    </div>
  )
}
