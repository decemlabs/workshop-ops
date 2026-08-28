import { s } from '@/design/style'
import { useV } from '@/model/context'

/** Скелетоны поверх контента на время загрузки. */
export function LoadingOverlay() {
  const v = useV()
  if (!v.loading) return null

  return (
    <div role="status" aria-busy="true" aria-label="Загрузка данных" style={s('position:absolute;inset:0;background:var(--bg);z-index:20;padding:18px 22px')}>
      <div className="dc-skel" style={s('width:190px;height:26px')}></div>
      <div className="dc-skel" style={s('width:320px;height:12px;margin-top:10px')}></div>
      <div style={s('margin-top:26px;display:flex;flex-direction:column;gap:10px')}>
        {v.skeletonRows.map((row) => (
          <div key={row} className="dc-skel" style={s('height:38px')}></div>
        ))}
      </div>
    </div>
  )
}
