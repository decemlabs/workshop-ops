import { dc, s } from '@/design/style'
import { useV } from '@/model/context'

/** Экран «Рабочие»: перетаскивание по цехам, массовые действия, пагинация. */
export function WorkersView() {
  const v = useV()
  if (!v.isWorkersAll) return null

  return (
    <div>
      <div style={s('display:flex;align-items:baseline;gap:14px;padding:18px 22px 14px;border-bottom:1px solid rgba(var(--ink-rgb),.25)')}>
        <div>
          <div style={s("font:700 26px/1 'IBM Plex Sans Condensed',sans-serif")}>Рабочие</div>
          <div style={s("margin-top:5px;font:400 11.5px 'IBM Plex Mono',monospace;color:var(--muted)")}>всего {v.countWorkers} · активных задач {v.countInWork} · выполнено {v.countDone}</div>
        </div>
        <button onClick={v.addWorkerAny} {...dc("margin-left:auto;align-self:center;font:600 13.5px 'IBM Plex Sans',sans-serif;padding:10px 16px;border:1px solid var(--accent);background:var(--accent);color:var(--on-accent);cursor:pointer;transition:background .12s,border-color .12s,transform .06s", { hover: 'background:var(--accent-dark);border-color:var(--accent-dark)', active: 'transform:translateY(1px)' })}>+ Добавить рабочего</button>
      </div>
      <div style={s('display:flex;align-items:center;gap:8px;padding:12px 22px 12px;border-bottom:1px solid rgba(var(--ink-rgb),.12)')}>
        <input value={v.q} onChange={v.onQ} type="search" aria-label="Поиск по имени рабочего или цеху" placeholder="Поиск по имени или цеху" style={s("flex:1;max-width:320px;height:36px;font:400 13px/1.2 'IBM Plex Sans',sans-serif;padding:0 11px;border:1px solid rgba(var(--ink-rgb),.4);background:var(--field);color:var(--ink)")} />
        <select value={v.fShopFilter} onChange={v.onShopFilter} style={s("width:170px;min-width:120px;flex:0 1 170px;height:36px;font:400 13px/1.2 'IBM Plex Sans',sans-serif;padding:0 11px;border:1px solid rgba(var(--ink-rgb),.4);background:var(--field);color:var(--ink)")}>
          {v.shopFilterOptions.map((o, i) => (
            <option key={i} value={o.value} disabled={o.disabled}>{o.label}</option>
          ))}
        </select>
        {v.filtersOn && (
          <button onClick={v.resetFilters} {...dc("height:36px;font:500 12.5px 'IBM Plex Sans',sans-serif;padding:0 14px;border:1px solid rgba(var(--ink-rgb),.35);background:transparent;color:var(--muted-strong);cursor:pointer;transition:background .12s,color .12s", { hover: 'background:var(--row-hover);color:var(--ink)' })}>Сбросить</button>
        )}
        <div style={s("margin-left:auto;white-space:nowrap;font:400 11.5px 'IBM Plex Mono',monospace;color:var(--muted)")}>найдено {v.workersFound}</div>
      </div>
      <div style={s('display:flex;flex-direction:column;gap:9px;padding:12px 22px;border-bottom:1px solid rgba(var(--ink-rgb),.12)')}>
        <div style={s("font:400 9.5px/1 'IBM Plex Mono',monospace;letter-spacing:.1em;color:var(--muted)")}>ПЕРЕТАЩИТЕ РАБОЧЕГО В ЦЕХ</div>
        <div style={s('display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:8px')}>
          {v.dropShops.map((d, i) => (
            <div key={i} onDragOver={d.onDragOver} onDragLeave={d.onDragLeave} onDrop={d.onDrop} style={s(`display:flex;align-items:center;gap:8px;padding:8px 12px;border:1px dashed rgba(var(--ink-rgb),.45);font:500 12px/1.2 'IBM Plex Sans',sans-serif;background:${d.bg};color:${d.fg};min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis`)}><span style={s('min-width:0;overflow:hidden;text-overflow:ellipsis')}>{d.label}</span><span style={s("margin-left:auto;font:400 11px 'IBM Plex Mono',monospace;opacity:.7")}>{d.count}</span></div>
          ))}
        </div>
      </div>
      {v.selWOn && (
        <div style={s('display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:11px 22px;background:var(--ink);color:var(--paper)')}>
          <div style={s("font:600 12.5px 'IBM Plex Sans',sans-serif")}>Выбрано: {v.selWCount}</div>
          <select onChange={v.onBulkMoveShop} aria-label="Перевести выбранных в цех" style={s("font:400 12.5px 'IBM Plex Sans',sans-serif;padding:7px 10px;border:1px solid rgba(var(--paper-rgb),.4);background:transparent;color:var(--paper)")}>
            {v.moveShopOptions.map((o, i) => (
              <option key={i} value={o.value} disabled={o.disabled} style={s('color:#161616')}>{o.label}</option>
            ))}
          </select>
          <button onClick={v.bulkDeleteWorkers} {...dc("font:600 12.5px 'IBM Plex Sans',sans-serif;padding:7px 13px;border:1px solid var(--danger);background:transparent;color:var(--danger);cursor:pointer;transition:background .12s,color .12s", { hover: 'background:var(--danger);color:var(--on-accent)' })}>Удалить выбранных</button>
          <button onClick={v.clearSelW} {...dc("margin-left:auto;font:500 12.5px 'IBM Plex Sans',sans-serif;padding:7px 13px;border:1px solid rgba(var(--paper-rgb),.35);background:transparent;color:rgba(var(--paper-rgb),.85);cursor:pointer;transition:background .12s,color .12s", { hover: 'background:rgba(var(--paper-rgb),.14);color:var(--paper)' })}>Снять выбор</button>
        </div>
      )}
      <div style={s('padding:0 22px')}>
        <div data-row="workers" role="row" style={s("display:grid;grid-template-columns:30px minmax(0,1.4fr) minmax(0,1.1fr) minmax(0,1.3fr) 125px 240px;padding:9px 12px;border-bottom:2px solid var(--ink);font:400 10px 'IBM Plex Mono',monospace;letter-spacing:.08em;color:var(--muted)")}>
          <div></div>
          <div role="button" tabIndex={0} aria-label="Сортировать по имени рабочего" onClick={v.onSortWName} onKeyDown={v.onSortKeyName} style={s('cursor:pointer;user-select:none')}>РАБОЧИЙ {v.sortWName}</div>
          <div role="button" tabIndex={0} aria-label="Сортировать по цеху" onClick={v.onSortWShop} onKeyDown={v.onSortKeyShop} style={s('cursor:pointer;user-select:none')}>ЦЕХ {v.sortWShop}</div>
          <div data-col="hide-md" role="button" tabIndex={0} aria-label="Сортировать по последней задаче" onClick={v.onSortWLast} onKeyDown={v.onSortKeyLast} style={s('cursor:pointer;user-select:none')}>ПОСЛЕДНЯЯ ЗАДАЧА {v.sortWLast}</div>
          <div role="button" tabIndex={0} aria-label="Сортировать по загрузке" onClick={v.onSortWLoad} onKeyDown={v.onSortKeyLoad} style={s('cursor:pointer;user-select:none')}>ЗАГРУЗКА {v.sortWLoad}</div>
          <div data-col="hide-md" style={s('text-align:right')}>ДЕЙСТВИЯ</div>
        </div>
        {v.allWorkerRows.map((row, i) => (
          <div key={i} data-row="workers" {...dc('display:grid;grid-template-columns:30px minmax(0,1.4fr) minmax(0,1.1fr) minmax(0,1.3fr) 125px 240px;align-items:center;padding:11px 12px;border-bottom:1px dotted rgba(var(--ink-rgb),.3);background:var(--paper);transition:background .1s', { hover: 'background:var(--row-hover)' })} draggable="true" onDragStart={row.onDragStart} onDragEnd={row.onDragEnd}>
            <div><input type="checkbox" checked={row.sel} onChange={row.toggle} aria-label="Выбрать рабочего" style={s('width:15px;height:15px;accent-color:var(--accent);cursor:pointer')} /></div>
            <div title={row.name} style={s("font:600 13.5px 'IBM Plex Sans',sans-serif;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:12px;cursor:grab")}>{row.name}</div>
            <div title={row.shop} style={s("font:400 12.5px 'IBM Plex Sans',sans-serif;color:var(--muted);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:12px")}>{row.shop}</div>
            <div data-col="hide-md" title={row.lastTask} style={s("font:400 12.5px 'IBM Plex Sans',sans-serif;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:14px")}>{row.lastTask}</div>
            <div style={s(`display:flex;align-items:center;gap:8px;font:500 12.5px 'IBM Plex Sans',sans-serif;color:${row.bar}`)}><span style={s(`width:9px;height:9px;border-radius:50%;display:inline-block;background:${row.bar}`)}></span>{row.active} / {row.total}</div>
            <div style={s('display:flex;gap:6px;justify-content:flex-end')}>
              <button onClick={row.open} {...dc("font:600 11.5px 'IBM Plex Sans',sans-serif;padding:6px 11px;border:1px solid var(--accent);background:var(--accent);color:var(--on-accent);cursor:pointer;transition:background .12s,border-color .12s,transform .06s", { hover: 'background:var(--accent-dark);border-color:var(--accent-dark)', active: 'transform:translateY(1px)' })}>Задачи</button>
              <button onClick={row.edit} {...dc("font:500 11.5px 'IBM Plex Sans',sans-serif;padding:6px 11px;border:1px solid rgba(var(--ink-rgb),.5);background:transparent;color:var(--ink);cursor:pointer;transition:background .12s,border-color .12s", { hover: 'background:var(--row-hover);border-color:var(--ink)' })}>Изменить</button>
              <button onClick={row.del} {...dc("font:500 11.5px 'IBM Plex Sans',sans-serif;padding:6px 11px;border:1px solid rgba(var(--danger-rgb),.6);background:transparent;color:var(--danger);cursor:pointer;transition:background .12s,color .12s", { hover: 'background:var(--danger);color:var(--on-accent)' })}>Удалить</button>
            </div>
          </div>
        ))}
        {v.workersEmpty && (
          <div style={s("padding:22px 0;font:400 12.5px 'IBM Plex Sans',sans-serif;color:var(--muted)")}>Ничего не найдено. Измените поиск или фильтр.</div>
        )}
        {v.workerPageOn && (
          <div style={s('display:flex;align-items:center;gap:10px;padding:12px 0')}>
            <div style={s("font:400 11.5px 'IBM Plex Mono',monospace;color:var(--muted)")}>{v.workerPageLabel}</div>
            <div style={s('margin-left:auto;display:flex;gap:6px')}>
              <button onClick={v.prevWorkerPage} {...dc("font:500 12.5px 'IBM Plex Sans',sans-serif;padding:7px 13px;border:1px solid rgba(var(--ink-rgb),.4);background:transparent;color:var(--ink);cursor:pointer;transition:background .12s,border-color .12s", { hover: 'background:var(--row-hover);border-color:var(--ink)' })}>← Назад</button>
              <button onClick={v.nextWorkerPage} {...dc("font:500 12.5px 'IBM Plex Sans',sans-serif;padding:7px 13px;border:1px solid rgba(var(--ink-rgb),.4);background:transparent;color:var(--ink);cursor:pointer;transition:background .12s,border-color .12s", { hover: 'background:var(--row-hover);border-color:var(--ink)' })}>Вперёд →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
