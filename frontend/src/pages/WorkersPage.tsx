import { QueryState } from '@/components/QueryState'
import { useWorkers } from '@/hooks/useWorkers'

/** Заготовка: разметку заменим на готовый шаблон, данные уже подключены. */
export function WorkersPage() {
  const { data, isPending, error } = useWorkers()

  return (
    <section className="page page--workers">
      <h1>Рабочие</h1>

      <QueryState isPending={isPending} error={error}>
        <ul>
          {data?.results.map((worker) => (
            <li key={worker.id}>
              {worker.name} — {worker.workshop_name}
            </li>
          ))}
        </ul>
      </QueryState>
    </section>
  )
}
