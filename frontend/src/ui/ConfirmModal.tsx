import { dc, s } from '@/design/style'
import { useV } from '@/model/context'

/** Подтверждение удаления. */
export function ConfirmModal() {
  const v = useV()
  if (!v.confirmOpen) return null

  return (
    <div style={s('position:fixed;inset:0;background:rgba(var(--ink-rgb),.42);display:flex;align-items:center;justify-content:center;z-index:60')}>
      <div style={s('width:400px;background:var(--paper);border:1px solid var(--danger);box-shadow:6px 6px 0 rgba(var(--ink-rgb),.18)')}>
        <div style={s("padding:13px 18px;border-bottom:1px solid var(--danger);font:700 14px 'IBM Plex Sans Condensed',sans-serif;letter-spacing:.04em;color:var(--danger)")}>УДАЛЕНИЕ</div>
        <div style={s("padding:18px;font:400 13px/1.5 'IBM Plex Sans',sans-serif")}>{v.confirmText}</div>
        <div style={s('padding:14px 18px;border-top:1px solid rgba(var(--ink-rgb),.3);display:flex;justify-content:flex-end;gap:8px;background:var(--surface-2)')}>
          <button onClick={v.closeConfirm} {...dc("font:500 12px 'IBM Plex Sans',sans-serif;padding:8px 16px;border:1px solid var(--ink);background:transparent;color:var(--ink);cursor:pointer;transition:background .12s,border-color .12s", { hover: 'background:var(--row-hover);border-color:var(--ink)' })}>Отмена</button>
          <button onClick={v.doDelete} style={s("font:600 12px 'IBM Plex Sans',sans-serif;padding:8px 18px;border:1px solid var(--danger);background:var(--danger);color:var(--on-accent);cursor:pointer")}>Удалить</button>
        </div>
      </div>
    </div>
  )
}
