import { dc, s } from '@/design/style'
import { useV } from '@/model/context'

/** Экран «Цеха»: карточки цехов. */
export function ShopsView() {
  const v = useV()
  if (!v.isShops) return null

  return (
    <div>
      <div style={s('display:flex;align-items:center;gap:14px;padding:18px 22px 14px;border-bottom:1px solid rgba(var(--ink-rgb),.25)')}>
        <div>
          <div style={s("font:700 26px/1 'IBM Plex Sans Condensed',sans-serif;letter-spacing:.02em")}>Цеха</div>
          <div style={s("margin-top:5px;font:400 11.5px 'IBM Plex Mono',monospace;color:var(--muted)")}>всего цехов {v.countShops} · рабочих {v.countWorkers} · задач {v.countTasks}</div>
        </div>
        <button onClick={v.addShop} {...dc("margin-left:auto;font:600 13.5px 'IBM Plex Sans',sans-serif;padding:10px 16px;border:1px solid var(--accent);background:var(--accent);color:var(--on-accent);cursor:pointer;transition:background .12s,border-color .12s,transform .06s", { hover: 'background:var(--accent-dark);border-color:var(--accent-dark)', active: 'transform:translateY(1px)' })}>+ Добавить цех</button>
      </div>
      <div style={s('padding:18px 22px 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:14px')}>
        {v.shopRows.map((row, i) => (
          <div key={i} {...dc('background:var(--paper);border:1px solid var(--ink);display:grid;grid-template-columns:74px minmax(0,1fr);transition:box-shadow .12s,transform .12s', { hover: 'box-shadow:5px 5px 0 rgba(var(--ink-rgb),.16);transform:translate(-1px,-1px)' })}>
            <div style={s('background:var(--ink);color:var(--paper);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px')}><span style={s("font:400 9.5px 'IBM Plex Mono',monospace;letter-spacing:.1em;opacity:.65")}>ЦЕХ</span><span style={s("font:600 26px/1 'IBM Plex Mono',monospace")}>{row.num}</span></div>
            <div style={s('padding:13px 15px;min-width:0;overflow:hidden')}>
              <div style={s("font:600 16px/1.2 'IBM Plex Sans',sans-serif")}>{row.name}</div>
              <div style={s('display:flex;gap:22px;margin:12px 0 13px;min-width:0;overflow:hidden')}>
                <div><div style={s("font:400 9.5px 'IBM Plex Mono',monospace;letter-spacing:.09em;color:var(--muted)")}>РАБОЧИХ</div><div style={s("font:600 19px/1 'IBM Plex Mono',monospace;margin-top:4px")}>{row.workers}</div></div>
                <div style={s('border-left:1px dotted rgba(var(--ink-rgb),.35);padding-left:22px')}><div style={s("font:400 9.5px 'IBM Plex Mono',monospace;letter-spacing:.09em;color:var(--muted);white-space:nowrap")}>АКТИВНЫХ ЗАДАЧ</div><div style={s("font:600 19px/1 'IBM Plex Mono',monospace;margin-top:4px;color:var(--accent)")}>{row.active}</div></div>
                <div style={s('border-left:1px dotted rgba(var(--ink-rgb),.35);padding-left:22px')}><div style={s("font:400 9.5px 'IBM Plex Mono',monospace;letter-spacing:.09em;color:var(--muted)")}>ВЫПОЛНЕНО</div><div style={s("font:600 19px/1 'IBM Plex Mono',monospace;margin-top:4px;color:var(--muted)")}>{row.done}</div></div>
                <div style={s('margin-left:auto;align-self:flex-end;display:flex;gap:3px;align-items:flex-end;height:26px;flex:none')}>
                  {row.bars.map((bar, j) => (
                    <span key={j} style={s(`width:7px;height:${bar.h};background:${bar.c};display:inline-block`)}></span>
                  ))}
                </div>
              </div>
              <div style={s('display:flex;border:1px solid rgba(var(--ink-rgb),.45)')}>
                <button onClick={row.open} {...dc("flex:1;font:600 11.5px 'IBM Plex Sans',sans-serif;padding:7px 0;border:0;background:var(--ink);color:var(--paper);cursor:pointer;transition:opacity .12s", { hover: 'opacity:.82' })}>Открыть</button>
                <button onClick={row.edit} {...dc("flex:1;font:500 11.5px 'IBM Plex Sans',sans-serif;padding:7px 0;border:0;border-left:1px solid rgba(var(--ink-rgb),.45);background:transparent;color:var(--ink);cursor:pointer;transition:background .12s,border-color .12s", { hover: 'background:var(--row-hover);border-color:var(--ink)' })}>Редактировать</button>
                <button onClick={row.del} {...dc("flex:none;font:500 11.5px 'IBM Plex Sans',sans-serif;padding:7px 13px;border:0;border-left:1px solid rgba(var(--ink-rgb),.45);background:transparent;color:var(--danger);cursor:pointer;transition:background .12s,color .12s", { hover: 'background:var(--danger);color:var(--on-accent)' })}>Удалить</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
