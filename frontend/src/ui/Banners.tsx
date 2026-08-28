import { dc, s } from '@/design/style'
import { useV } from '@/model/context'

/** Баннер ошибки загрузки с кнопкой повтора. */
export function ErrorBanner() {
  const v = useV()
  if (!v.errorOpen) return null

  return (
    <div role="alert" style={s("display:flex;align-items:center;gap:12px;padding:12px 22px;background:rgba(var(--danger-rgb),.1);border-bottom:1px solid rgba(var(--danger-rgb),.4);font:500 13px 'IBM Plex Sans',sans-serif;color:var(--danger)")}>
      {v.errorText}
      <button onClick={v.retry} {...dc("font:600 12.5px 'IBM Plex Sans',sans-serif;padding:7px 13px;border:1px solid var(--danger);background:transparent;color:var(--danger);cursor:pointer;transition:background .12s,color .12s", { hover: 'background:var(--danger);color:var(--on-accent)' })}>Повторить</button>
    </div>
  )
}
