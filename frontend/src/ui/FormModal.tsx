import { dc, s } from '@/design/style'
import { useV } from '@/model/context'

/** Модалка создания и редактирования цеха, рабочего или задачи. */
export function FormModal() {
  const v = useV()
  if (!v.modalOpen) return null

  return (
    <div style={s('position:fixed;inset:0;background:rgba(var(--ink-rgb),.42);display:flex;align-items:center;justify-content:center;z-index:50')}>
      <div style={s('width:430px;background:var(--paper);border:1px solid var(--ink);box-shadow:6px 6px 0 rgba(var(--ink-rgb),.18)')}>
        <div style={s('padding:13px 18px;border-bottom:1px solid var(--ink);display:flex;align-items:baseline;gap:10px')}>
          <div style={s("font:700 14px 'IBM Plex Sans Condensed',sans-serif;letter-spacing:.04em")}>{v.modalTitle}</div>
          <div style={s("font:400 10.5px 'IBM Plex Mono',monospace;color:var(--muted)")}>{v.modalKindLabel}</div>
        </div>
        <div style={s('padding:18px;display:flex;flex-direction:column;gap:14px')}>
          <div>
            <div style={s("font:400 10px 'IBM Plex Mono',monospace;letter-spacing:.08em;color:var(--muted);margin-bottom:6px")}>{v.nameLabel}</div>
            <input value={v.fName} onChange={v.onName} placeholder={v.namePlaceholder} style={s("width:100%;padding:9px 11px;border:1px solid var(--ink);background:var(--field);font:400 13px 'IBM Plex Sans',sans-serif;color:var(--ink)")} />
            {v.nameErr && (
              <div role="alert" style={s("margin-top:7px;display:flex;align-items:center;gap:7px;font:500 12px 'IBM Plex Sans',sans-serif;color:var(--danger)")}>
                <span style={s('width:7px;height:7px;border-radius:50%;background:var(--danger);display:inline-block')}></span>{v.nameErr}
              </div>
            )}
          </div>
          {v.showNum && (
            <div>
              <div style={s("font:400 10px 'IBM Plex Mono',monospace;letter-spacing:.08em;color:var(--muted);margin-bottom:6px")}>НОМЕР ЦЕХА</div>
              <input value={v.fNum} onChange={v.onNum} style={s("width:120px;padding:9px 11px;border:1px solid var(--ink);background:var(--field);font:400 13px 'IBM Plex Mono',monospace;color:var(--ink)")} />
            </div>
          )}
          {v.showShop && (
            <div>
              <div style={s("font:400 10px 'IBM Plex Mono',monospace;letter-spacing:.08em;color:var(--muted);margin-bottom:6px")}>ЦЕХ</div>
              <select value={v.fShop} onChange={v.onShop} style={s("width:100%;padding:9px 11px;border:1px solid var(--ink);background:var(--field);font:400 13px 'IBM Plex Sans',sans-serif;color:var(--ink)")}>
                {v.shopOptions.map((o, i) => (
                  <option key={i} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
          {v.showWorkerSelect && (
            <div>
              <div style={s("font:400 10px 'IBM Plex Mono',monospace;letter-spacing:.08em;color:var(--muted);margin-bottom:6px")}>РАБОЧИЙ</div>
              <select value={v.fWorker} onChange={v.onWorker} style={s("width:100%;padding:9px 11px;border:1px solid var(--ink);background:var(--field);font:400 13px 'IBM Plex Sans',sans-serif;color:var(--ink)")}>
                {v.workerOptions.map((o, i) => (
                  <option key={i} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
          {v.showStatus && (
            <div>
              <div style={s("font:400 10px 'IBM Plex Mono',monospace;letter-spacing:.08em;color:var(--muted);margin-bottom:6px")}>СТАТУС</div>
              <select value={v.fStatus} onChange={v.onStatus} style={s("width:100%;padding:9px 11px;border:1px solid var(--ink);background:var(--field);font:400 13px 'IBM Plex Sans',sans-serif;color:var(--ink)")}>
                {v.statusOptions.map((o, i) => (
                  <option key={i} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div style={s('padding:14px 18px;border-top:1px solid rgba(var(--ink-rgb),.3);display:flex;justify-content:flex-end;gap:8px;background:var(--surface-2)')}>
          <button onClick={v.closeModal} {...dc("font:500 12px 'IBM Plex Sans',sans-serif;padding:8px 16px;border:1px solid var(--ink);background:transparent;color:var(--ink);cursor:pointer;transition:background .12s,border-color .12s", { hover: 'background:var(--row-hover);border-color:var(--ink)' })}>Отмена</button>
          <button onClick={v.saveModal} {...dc("font:600 12px 'IBM Plex Sans',sans-serif;padding:8px 18px;border:1px solid var(--accent);background:var(--accent);color:var(--on-accent);cursor:pointer;transition:background .12s,border-color .12s,transform .06s", { hover: 'background:var(--accent-dark);border-color:var(--accent-dark)', active: 'transform:translateY(1px)' })}>Сохранить</button>
        </div>
      </div>
    </div>
  )
}
