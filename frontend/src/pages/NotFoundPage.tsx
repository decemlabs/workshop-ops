import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <section className="page page--not-found">
      <h1>Страница не найдена</h1>
      <Link to="/tasks">К задачам</Link>
    </section>
  )
}
