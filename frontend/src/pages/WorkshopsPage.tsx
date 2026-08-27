import { QueryState } from '@/components/QueryState'
import { useWorkshops } from '@/hooks/useWorkshops'

/** Заготовка: разметку заменим на готовый шаблон, данные уже подключены. */
export function WorkshopsPage() {
  const { data, isPending, error } = useWorkshops()

  return (
    <section className="page page--workshops">
      <h1>Цеха</h1>

      <QueryState isPending={isPending} error={error}>
        <ul>
          {data?.results.map((workshop) => (
            <li key={workshop.id}>
              {workshop.name}
              {!workshop.is_active && ' — не работает'}
            </li>
          ))}
        </ul>
      </QueryState>
    </section>
  )
}
