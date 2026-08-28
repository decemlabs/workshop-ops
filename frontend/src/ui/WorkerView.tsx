import { dc, s } from '@/design/style'
import { useV } from '@/model/context'

/** Экран рабочего: таблица его задач. */
export function WorkerView() {
  const v = useV()
  if (!v.isWorker) return null

  return (
    <div>
      <div style={s("padding:16px 22px 0;font:400 11px 'IBM Plex Mono',monospace;color:var(--muted)")}><a href="#" onClick={v.navShops}>Цеха</a> / <a href="#" onClick={v.backToShop}>{v.workerShop}</a> / {v.workerName}</div>
      <div style={s('display:flex;align-items:center;gap:14px;padding:10px 22px 14px;border-bottom:1px solid rgba(var(--ink-rgb),.25)')}>
        <div>
          <div style={s("font:700 26px/1 'IBM Plex Sans Condensed',sans-serif")}>{v.workerName}</div>
          <div style={s("margin-top:5px;font:400 11.5px 'IBM Plex Mono',monospace;color:var(--muted)")}>{v.workerShop} · {v.workerMeta}</div>
        </div>
        <div style={s('margin-left:auto;display:flex;gap:8px')}>
          <button onClick={v.editWorker} {...dc("font:500 12px 'IBM Plex Sans',sans-serif;padding:8px 14px;border:1px solid var(--ink);background:transparent;color:var(--ink);cursor:pointer;transition:background .12s,border-color .12s", { hover: 'background:var(--row-hover);border-color:var(--ink)' })}>Редактировать</button>
          <button onClick={v.addTask} {...dc("font:600 12px 'IBM Plex Sans',sans-serif;padding:8px 14px;border:1px solid var(--accent);background:var(--accent);color:var(--on-accent);cursor:pointer;transition:background .12s,border-color .12s,transform .06s", { hover: 'background:var(--accent-dark);border-color:var(--accent-dark)', active: 'transform:translateY(1px)' })}>+ Добавить задачу</button>
        </div>
      </div>
      <div style={s('padding:0 22px')}>
        <div style={s("display:grid;grid-template-columns:1fr 190px 200px;padding:9px 12px;border-bottom:2px solid var(--ink);font:400 10px 'IBM Plex Mono',monospace;letter-spacing:.08em;color:var(--muted)")}>
          <div>ЗАДАЧА</div><div>СТАТУС</div><div>ДЕЙСТВИЯ</div>
        </div>
        {v.workerTaskRows.map((row, i) => (
          <div key={i} {...dc('display:grid;grid-template-columns:1fr 190px 200px;align-items:center;padding:11px 12px;border-bottom:1px dotted rgba(var(--ink-rgb),.3);background:var(--paper);transition:background .1s', { hover: 'background:var(--row-hover)' })}>
            <div style={s("font:600 13.5px 'IBM Plex Sans',sans-serif")}>{row.title}<span style={s("font:400 11px 'IBM Plex Mono',monospace;color:var(--faint);margin-left:9px")}>{row.code}</span></div>
            <div style={s(`display:flex;align-items:center;gap:8px;font:500 12.5px 'IBM Plex Sans',sans-serif;color:${row.color}`)}><span style={s(`width:9px;height:9px;border-radius:50%;background:${row.color};display:inline-block`)}></span>{row.status}</div>
            <div style={s('display:flex;gap:6px;justify-content:flex-end')}>
              <button onClick={row.edit} {...dc("font:500 11.5px 'IBM Plex Sans',sans-serif;padding:6px 11px;border:1px solid rgba(var(--ink-rgb),.5);background:transparent;color:var(--ink);cursor:pointer;transition:background .12s,border-color .12s", { hover: 'background:var(--row-hover);border-color:var(--ink)' })}>Изменить</button>
              <button onClick={row.del} {...dc("font:500 11.5px 'IBM Plex Sans',sans-serif;padding:6px 11px;border:1px solid rgba(var(--danger-rgb),.6);background:transparent;color:var(--danger);cursor:pointer;transition:background .12s,color .12s", { hover: 'background:var(--danger);color:var(--on-accent)' })}>Удалить</button>
            </div>
          </div>
        ))}
        {v.workerEmpty && (
          <div style={s("padding:22px;border:1px dashed rgba(var(--ink-rgb),.4);margin-top:14px;font:400 12.5px 'IBM Plex Sans',sans-serif;color:var(--muted)")}>Задач нет. Добавьте задачу рабочему.</div>
        )}
      </div>
    </div>
  )
}
