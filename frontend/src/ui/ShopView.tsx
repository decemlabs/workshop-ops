import { dc, s } from '@/design/style'
import { useV } from '@/model/context'

/** Экран цеха: поиск, сортировки и таблица рабочих. */
export function ShopView() {
  const v = useV()
  if (!v.isShop) return null

  return (
    <div>
      <div style={s("padding:16px 22px 0;font:400 11px 'IBM Plex Mono',monospace;color:var(--muted)")}><a href="#" onClick={v.navShops}>Цеха</a> / {v.shopTitle}</div>
      <div style={s('display:flex;align-items:center;gap:14px;padding:10px 22px 14px;border-bottom:1px solid rgba(var(--ink-rgb),.25)')}>
        <div style={s("font:700 26px/1 'IBM Plex Sans Condensed',sans-serif")}>{v.shopTitle}</div>
        <div style={s("font:400 11px 'IBM Plex Mono',monospace;color:var(--muted)")}>{v.shopMeta}</div>
        <div style={s('margin-left:auto;display:flex;gap:8px')}>
          <button onClick={v.editShop} {...dc("font:500 12px 'IBM Plex Sans',sans-serif;padding:8px 14px;border:1px solid var(--ink);background:transparent;color:var(--ink);cursor:pointer;transition:background .12s,border-color .12s", { hover: 'background:var(--row-hover);border-color:var(--ink)' })}>Редактировать</button>
          <button onClick={v.addWorker} {...dc("font:600 12px 'IBM Plex Sans',sans-serif;padding:8px 14px;border:1px solid var(--accent);background:var(--accent);color:var(--on-accent);cursor:pointer;transition:background .12s,border-color .12s,transform .06s", { hover: 'background:var(--accent-dark);border-color:var(--accent-dark)', active: 'transform:translateY(1px)' })}>+ Добавить рабочего</button>
        </div>
      </div>
      <div style={s('display:flex;align-items:center;gap:8px;padding:0 22px 12px')}>
        <input value={v.qShop} onChange={v.onQShop} type="search" aria-label="Поиск по рабочим цеха" placeholder="Поиск по рабочим цеха" style={s("flex:1;max-width:320px;height:36px;font:400 13px/1.2 'IBM Plex Sans',sans-serif;padding:0 11px;border:1px solid rgba(var(--ink-rgb),.4);background:var(--field);color:var(--ink)")} />
        <div style={s("margin-left:auto;white-space:nowrap;font:400 11.5px 'IBM Plex Mono',monospace;color:var(--muted)")}>найдено {v.shopFound}</div>
      </div>
      <div style={s('padding:0 22px')}>
        <div data-row="shop" style={s("display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1.3fr) 130px 240px;padding:9px 12px;border-bottom:2px solid var(--ink);font:400 10px 'IBM Plex Mono',monospace;letter-spacing:.08em;color:var(--muted)")}>
          <div role="button" tabIndex={0} aria-label="Сортировать по имени" onClick={v.onSortSName} onKeyDown={v.onSortKeySName} style={s('cursor:pointer;user-select:none')}>РАБОЧИЙ {v.sortSName}</div>
          <div role="button" tabIndex={0} aria-label="Сортировать по последней задаче" onClick={v.onSortSLast} onKeyDown={v.onSortKeySLast} style={s('cursor:pointer;user-select:none')}>ПОСЛЕДНЯЯ ЗАДАЧА {v.sortSLast}</div>
          <div role="button" tabIndex={0} aria-label="Сортировать по загрузке" onClick={v.onSortSLoad} onKeyDown={v.onSortKeySLoad} style={s('cursor:pointer;user-select:none')}>ЗАГРУЗКА {v.sortSLoad}</div>
          <div style={s('text-align:right')}>ДЕЙСТВИЯ</div>
        </div>
        {v.shopWorkerRows.map((row, i) => (
          <div key={i} data-row="shop" {...dc('display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1.3fr) 130px 240px;align-items:center;padding:11px 12px;border-bottom:1px dotted rgba(var(--ink-rgb),.3);background:var(--paper);transition:background .1s', { hover: 'background:var(--row-hover)' })}>
            <div style={s("font:600 13.5px 'IBM Plex Sans',sans-serif")}>{row.name}</div>
            <div style={s("font:400 12.5px 'IBM Plex Sans',sans-serif;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:14px")}>{row.lastTask}</div>
            <div style={s(`display:flex;align-items:center;gap:8px;font:500 12.5px 'IBM Plex Sans',sans-serif;color:${row.bar}`)}><span style={s(`width:9px;height:9px;border-radius:50%;display:inline-block;background:${row.bar}`)}></span>{row.active} / {row.total}</div>
            <div style={s('display:flex;gap:6px;justify-content:flex-end')}>
              <button onClick={row.open} {...dc("font:600 11.5px 'IBM Plex Sans',sans-serif;padding:6px 11px;border:1px solid var(--accent);background:var(--accent);color:var(--on-accent);cursor:pointer;transition:background .12s,border-color .12s,transform .06s", { hover: 'background:var(--accent-dark);border-color:var(--accent-dark)', active: 'transform:translateY(1px)' })}>Задачи</button>
              <button onClick={row.edit} {...dc("font:500 11.5px 'IBM Plex Sans',sans-serif;padding:6px 11px;border:1px solid rgba(var(--ink-rgb),.5);background:transparent;color:var(--ink);cursor:pointer;transition:background .12s,border-color .12s", { hover: 'background:var(--row-hover);border-color:var(--ink)' })}>Изменить</button>
              <button onClick={row.del} {...dc("font:500 11.5px 'IBM Plex Sans',sans-serif;padding:6px 11px;border:1px solid rgba(var(--danger-rgb),.6);background:transparent;color:var(--danger);cursor:pointer;transition:background .12s,color .12s", { hover: 'background:var(--danger);color:var(--on-accent)' })}>Удалить</button>
            </div>
          </div>
        ))}
        {v.shopEmpty && (
          <div style={s("padding:22px;border:1px dashed rgba(var(--ink-rgb),.4);margin-top:14px;font:400 12.5px 'IBM Plex Sans',sans-serif;color:var(--muted)")}>В цехе нет рабочих. Добавьте первого рабочего.</div>
        )}
        {v.shopSearchEmpty && (
          <div style={s("padding:22px 0;font:400 12.5px 'IBM Plex Sans',sans-serif;color:var(--muted)")}>Ничего не найдено. Измените поиск.</div>
        )}
      </div>
    </div>
  )
}
