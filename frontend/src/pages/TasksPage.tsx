import { TASK_STATUS_LABELS } from '@/api/types'
import { QueryState } from '@/components/QueryState'
import { useTasks } from '@/hooks/useTasks'

/** Заготовка: разметку заменим на готовый шаблон, данные уже подключены. */
export function TasksPage() {
  const { data, isPending, error } = useTasks()

  return (
    <section className="page page--tasks">
      <h1>Задачи</h1>

      <QueryState isPending={isPending} error={error}>
        <ul>
          {data?.results.map((task) => (
            <li key={task.id}>
              {task.title} — {task.worker_name} — {TASK_STATUS_LABELS[task.status]}
            </li>
          ))}
        </ul>
      </QueryState>
    </section>
  )
}
