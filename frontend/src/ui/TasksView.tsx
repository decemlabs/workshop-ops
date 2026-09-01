import { dc, s } from '@/design/style'
import { useV } from '@/model/context'

/** Экран «Задачи»: фильтры, массовые действия, пагинация. */
export function TasksView() {
  const v = useV()
  if (!v.isTasksAll) return null

  return (
    <div>
      <div style={s('display:flex;align-items:baseline;gap:14px;padding:18px 22px 14px;border-bottom:1px solid rgba(var(--ink-rgb),.25)')}>
        <div>
          <div style={s("font:700 26px/1 'IBM Plex Sans Condensed',sans-serif")}>Задачи</div>
          <div style={s("margin-top:5px;font:400 11.5px 'IBM Plex Mono',monospace;color:var(--muted)")}>всего {v.countTasks} · в работе {v.countInWork} · новых {v.countNew} · выполнено {v.countDone}</div>
        </div>
        <button onClick={v.addTaskAny} {...dc("margin-left:auto;align-self:center;font:600 13.5px 'IBM Plex Sans',sans-serif;padding:10px 16px;border:1px solid var(--accent);background:var(--accent);color:var(--on-accent);cursor:pointer;transition:background .12s,border-color .12s,transform .06s", { hover: 'background:var(--accent-dark);border-color:var(--accent-dark)', active: 'transform:translateY(1px)' })}>+ Добавить задачу</button>
      </div>
      <div style={s('display:flex;align-items:center;gap:8px;padding:12px 22px;border-bottom:1px solid rgba(var(--ink-rgb),.12);flex-wrap:wrap')}>
        <input value={v.q} onChange={v.onQ} placeholder="Поиск по задаче, номеру или рабочему" style={s("flex:1 1 200px;min-width:160px;max-width:300px;height:36px;font:400 13px/1.2 'IBM Plex Sans',sans-serif;padding:0 11px;border:1px solid rgba(var(--ink-rgb),.4);background:var(--field);color:var(--ink)")} />
        <select value={v.fShopFilter} onChange={v.onShopFilter} style={s("width:170px;min-width:120px;flex:0 1 170px;height:36px;font:400 13px/1.2 'IBM Plex Sans',sans-serif;padding:0 11px;border:1px solid rgba(var(--ink-rgb),.4);background:var(--field);color:var(--ink)")}>
          {v.shopFilterOptions.map((o, i) => (
            <option key={i} value={o.value} disabled={o.disabled}>{o.label}</option>
          ))}
        </select>
        <select value={v.fWorkerFilter} onChange={v.onWorkerFilter} style={s("width:170px;min-width:120px;flex:0 1 170px;height:36px;font:400 13px/1.2 'IBM Plex Sans',sans-serif;padding:0 11px;border:1px solid rgba(var(--ink-rgb),.4);background:var(--field);color:var(--ink)")}>
          {v.workerFilterOptions.map((o, i) => (
            <option key={i} value={o.value} disabled={o.disabled}>{o.label}</option>
          ))}
        </select>
        <select value={v.fStatusFilter} onChange={v.onStatusFilter} style={s("width:170px;min-width:120px;flex:0 1 170px;height:36px;font:400 13px/1.2 'IBM Plex Sans',sans-serif;padding:0 11px;border:1px solid rgba(var(--ink-rgb),.4);background:var(--field);color:var(--ink)")}>
          {v.statusFilterOptions.map((o, i) => (
            <option key={i} value={o.value} disabled={o.disabled}>{o.label}</option>
          ))}
        </select>
        {v.filtersOn && (
          <button onClick={v.resetFilters} {...dc("height:36px;font:500 12.5px 'IBM Plex Sans',sans-serif;padding:0 14px;border:1px solid rgba(var(--ink-rgb),.35);background:transparent;color:var(--muted-strong);cursor:pointer;transition:background .12s,color .12s", { hover: 'background:var(--row-hover);color:var(--ink)' })}>Сбросить</button>
        )}
        <div style={s("margin-left:auto;white-space:nowrap;font:400 11.5px 'IBM Plex Mono',monospace;color:var(--muted)")}>найдено {v.tasksFound}</div>
      </div>
      {v.selTOn && (
        <div style={s('display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:11px 22px;background:var(--ink);color:var(--paper)')}>
          <div style={s("font:600 12.5px 'IBM Plex Sans',sans-serif")}>Выбрано: {v.selTCount}</div>
          <select onChange={v.onBulkStatus} aria-label="Сменить статус выбранных" style={s("font:400 12.5px 'IBM Plex Sans',sans-serif;padding:7px 10px;border:1px solid rgba(var(--paper-rgb),.4);background:transparent;color:var(--paper)")}>
            {v.bulkStatusOptions.map((o, i) => (
              <option key={i} value={o.value} disabled={o.disabled} style={s('color:#161616')}>{o.label}</option>
            ))}
          </select>
          <button onClick={v.bulkDeleteTasks} {...dc("font:600 12.5px 'IBM Plex Sans',sans-serif;padding:7px 13px;border:1px solid var(--danger);background:transparent;color:var(--danger);cursor:pointer;transition:background .12s,color .12s", { hover: 'background:var(--danger);color:var(--on-accent)' })}>Удалить выбранные</button>
          <button onClick={v.clearSelT} {...dc("margin-left:auto;font:500 12.5px 'IBM Plex Sans',sans-serif;padding:7px 13px;border:1px solid rgba(var(--paper-rgb),.35);background:transparent;color:rgba(var(--paper-rgb),.85);cursor:pointer;transition:background .12s,color .12s", { hover: 'background:rgba(var(--paper-rgb),.14);color:var(--paper)' })}>Снять выбор</button>
        </div>
      )}
      <div style={s('display:none')}>
      </div>
      <div style={s('padding:0 22px')}>
        <div data-row="tasks" style={s("display:grid;grid-template-columns:30px minmax(0,2fr) minmax(0,1.1fr) minmax(0,1fr) 125px 240px;padding:9px 12px;border-bottom:2px solid var(--ink);font:400 10px 'IBM Plex Mono',monospace;letter-spacing:.08em;color:var(--muted)")}>
          <div></div>
          <div role="button" tabIndex={0} aria-label="Сортировать по названию задачи" onClick={v.onSortTTitle} onKeyDown={v.onSortKeyTTitle} style={s('cursor:pointer;user-select:none')}>ЗАДАЧА {v.sortTTitle}</div>
          <div role="button" tabIndex={0} aria-label="Сортировать по рабочему" onClick={v.onSortTWorker} onKeyDown={v.onSortKeyTWorker} style={s('cursor:pointer;user-select:none')}>РАБОЧИЙ {v.sortTWorker}</div>
          <div data-col="hide-md" role="button" tabIndex={0} aria-label="Сортировать по цеху" onClick={v.onSortTShop} onKeyDown={v.onSortKeyTShop} style={s('cursor:pointer;user-select:none')}>ЦЕХ {v.sortTShop}</div>
          <div role="button" tabIndex={0} aria-label="Сортировать по статусу" onClick={v.onSortTStatus} onKeyDown={v.onSortKeyTStatus} style={s('cursor:pointer;user-select:none')}>СТАТУС {v.sortTStatus}</div>
          <div data-col="hide-md" style={s('text-align:right')}>ДЕЙСТВИЯ</div>
        </div>
        {v.allTaskRows.map((row, i) => (
          <div key={i} data-row="tasks" {...dc('display:grid;grid-template-columns:30px minmax(0,2fr) minmax(0,1.1fr) minmax(0,1fr) 125px 240px;align-items:center;padding:11px 12px;border-bottom:1px dotted rgba(var(--ink-rgb),.3);background:var(--paper);transition:background .1s', { hover: 'background:var(--row-hover)' })}>
            <div><input type="checkbox" checked={row.sel} onChange={row.toggle} aria-label="Выбрать задачу" style={s('width:15px;height:15px;accent-color:var(--accent);cursor:pointer')} /></div>
            <div title={row.title} style={s("font:600 13.5px 'IBM Plex Sans',sans-serif;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:12px")}>{row.title}<span style={s("font:400 11px 'IBM Plex Mono',monospace;color:var(--faint);margin-left:9px")}>{row.code}</span></div>
            <div title={row.worker} style={s("font:400 12.5px 'IBM Plex Sans',sans-serif;color:var(--muted);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:12px")}>{row.unassigned ? (<span style={s("display:inline-block;padding:1px 8px;border:1px dashed rgba(var(--danger-rgb),.55);color:var(--danger);font:500 11px/1.5 'IBM Plex Mono',monospace")}>{row.worker}</span>) : (row.worker)}</div>
            <div data-col="hide-md" title={row.shop} style={s("font:400 12.5px 'IBM Plex Sans',sans-serif;color:var(--muted);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:12px")}>{row.shop}</div>
            <div style={s(`display:flex;align-items:center;gap:8px;font:500 12.5px 'IBM Plex Sans',sans-serif;color:${row.color}`)}><span style={s(`width:9px;height:9px;border-radius:50%;background:${row.color};display:inline-block`)}></span>{row.status}</div>
            <div style={s('display:flex;gap:6px;justify-content:flex-end')}>
              <button onClick={row.edit} {...dc("font:500 11.5px 'IBM Plex Sans',sans-serif;padding:6px 11px;border:1px solid rgba(var(--ink-rgb),.5);background:transparent;color:var(--ink);cursor:pointer;transition:background .12s,border-color .12s", { hover: 'background:var(--row-hover);border-color:var(--ink)' })}>Изменить</button>
              <button onClick={row.del} {...dc("font:500 11.5px 'IBM Plex Sans',sans-serif;padding:6px 11px;border:1px solid rgba(var(--danger-rgb),.6);background:transparent;color:var(--danger);cursor:pointer;transition:background .12s,color .12s", { hover: 'background:var(--danger);color:var(--on-accent)' })}>Удалить</button>
            </div>
          </div>
        ))}
        {v.tasksEmptyAll && (
          <div style={s("padding:22px 0;font:400 12.5px 'IBM Plex Sans',sans-serif;color:var(--muted)")}>Ничего не найдено. Измените поиск или фильтры.</div>
        )}
        {v.taskPageOn && (
          <div style={s('display:flex;align-items:center;gap:10px;padding:12px 0')}>
            <div style={s("font:400 11.5px 'IBM Plex Mono',monospace;color:var(--muted)")}>{v.taskPageLabel}</div>
            <div style={s('margin-left:auto;display:flex;gap:6px')}>
              <button onClick={v.prevTaskPage} {...dc("font:500 12.5px 'IBM Plex Sans',sans-serif;padding:7px 13px;border:1px solid rgba(var(--ink-rgb),.4);background:transparent;color:var(--ink);cursor:pointer;transition:background .12s,border-color .12s", { hover: 'background:var(--row-hover);border-color:var(--ink)' })}>← Назад</button>
              <button onClick={v.nextTaskPage} {...dc("font:500 12.5px 'IBM Plex Sans',sans-serif;padding:7px 13px;border:1px solid rgba(var(--ink-rgb),.4);background:transparent;color:var(--ink);cursor:pointer;transition:background .12s,border-color .12s", { hover: 'background:var(--row-hover);border-color:var(--ink)' })}>Вперёд →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
