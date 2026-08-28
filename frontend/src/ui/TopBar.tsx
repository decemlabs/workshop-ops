import { dc, s } from '@/design/style'
import { useV } from '@/model/context'

/** Верхняя панель 44px: пользователь, дата смены, полоса статусов, выход. */
export function TopBar() {
  const v = useV()

  return (
    <div style={s('display:grid;grid-template-columns:210px minmax(0,1fr) auto 96px;height:44px;background:var(--ink);color:var(--paper)')}>
      <div style={s("display:flex;align-items:center;padding:0 16px;border-right:1px solid rgba(var(--paper-rgb),.18);font:700 15px/1 'IBM Plex Sans Condensed',sans-serif;letter-spacing:.07em")}>MES · ПРОИЗВОДСТВО</div>
      <div style={s("display:flex;align-items:center;gap:10px;padding:0 16px;border-right:1px solid rgba(var(--paper-rgb),.18);min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font:500 12.5px/1 'IBM Plex Sans',sans-serif")}>Кузнецов А. В.<span style={s("font:400 11.5px/1 'IBM Plex Mono',monospace;color:rgba(var(--paper-rgb),.5)")}>мастер цеха</span></div>
      <div style={s('display:flex;align-items:center;gap:14px;padding:0 16px;border-right:1px solid rgba(var(--paper-rgb),.18);white-space:nowrap')}>
        <div style={s("display:flex;align-items:center;gap:7px;font:400 11px/1 'IBM Plex Mono',monospace;color:rgba(var(--paper-rgb),.5)")}>{v.shiftDate}</div>
        <div style={s('display:flex;width:96px;height:7px;background:rgba(var(--paper-rgb),.16)')}>
          <span style={s(`width:${v.pctInWork};background:var(--accent-soft);display:inline-block`)}></span>
          <span style={s(`width:${v.pctNew};background:rgba(var(--paper-rgb),.4);display:inline-block`)}></span>
          <span style={s(`width:${v.pctDone};background:var(--ok-soft);display:inline-block`)}></span>
        </div>
        <div style={s("display:flex;align-items:center;gap:5px;font:500 11.5px/1 'IBM Plex Mono',monospace")} title="В работе"><span style={s('width:7px;height:7px;background:var(--accent-soft);display:inline-block')}></span>{v.countInWork}</div>
        <div style={s("display:flex;align-items:center;gap:5px;font:500 11.5px/1 'IBM Plex Mono',monospace")} title="Новые"><span style={s('width:7px;height:7px;background:rgba(var(--paper-rgb),.4);display:inline-block')}></span>{v.countNew}</div>
        <div style={s("display:flex;align-items:center;gap:5px;font:500 11.5px/1 'IBM Plex Mono',monospace")} title="Выполнено"><span style={s('width:7px;height:7px;background:var(--ok-soft);display:inline-block')}></span>{v.countDone}</div>
      </div>
      <button onClick={v.logout} {...dc("height:100%;width:100%;border:0;background:transparent;color:rgba(var(--paper-rgb),.8);font:500 11.5px 'IBM Plex Sans',sans-serif;cursor:pointer;transition:background .12s,color .12s", { hover: 'background:rgba(var(--paper-rgb),.12);color:var(--paper)', active: 'background:rgba(var(--paper-rgb),.2)' })}>Выйти</button>
    </div>
  )
}
