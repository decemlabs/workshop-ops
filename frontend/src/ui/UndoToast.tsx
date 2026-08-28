import { s } from '@/design/style'
import { useV } from '@/model/context'

/** Тост «Вернуть» после удаления, живёт 9 секунд. */
export function UndoToast() {
  const v = useV()
  if (!v.undoOpen) return null

  return (
    <div role="status" aria-live="polite" style={s('position:fixed;left:50%;bottom:26px;transform:translateX(-50%);display:flex;align-items:center;gap:16px;padding:13px 16px;background:var(--ink);color:var(--paper);box-shadow:0 8px 24px rgba(0,0,0,.25);z-index:60')}>
      <div style={s("font:400 13px 'IBM Plex Sans',sans-serif")}>{v.undoText}</div>
      <button onClick={v.doUndo} style={s("font:600 13px 'IBM Plex Sans',sans-serif;padding:7px 14px;border:1px solid var(--paper);background:transparent;color:var(--paper);cursor:pointer")}>Вернуть</button>
      <button onClick={v.dismissUndo} style={s("font:400 15px 'IBM Plex Sans',sans-serif;padding:2px 6px;border:none;background:transparent;color:rgba(var(--paper-rgb),.6);cursor:pointer")}>×</button>
    </div>
  )
}
