import { dc, s } from '@/design/style'
import { useV } from '@/model/context'

/** Баннер потери связи с сервером. */
export function OfflineBanner() {
  const v = useV()
  if (!v.offline) return null

  return (
    <div role="status" style={s("display:flex;align-items:center;gap:10px;padding:10px 22px;background:var(--surface-2);border-bottom:1px solid rgba(var(--ink-rgb),.25);font:500 12.5px 'IBM Plex Sans',sans-serif;color:var(--muted-strong)")}>
      <span style={s('width:9px;height:9px;border-radius:50%;background:var(--danger);display:inline-block')}></span>Нет связи с сервером. Изменения сохранятся локально и отправятся при восстановлении сети.
    </div>
  )
}

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
