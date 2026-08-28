import { s } from '@/design/style'
import { useV } from '@/model/context'

/** Левая колонка: навигация со счётчиками и сводка смены. */
export function Sidebar() {
  const v = useV()

  return (
    <div style={s('background:var(--ink);color:var(--paper);padding:0 12px 12px;display:flex;flex-direction:column;gap:8px')}>
      <div style={s('display:flex;flex-direction:column;gap:6px')}>
        <button onClick={v.navShops} style={s(`text-align:left;display:grid;grid-template-columns:38px 1fr;align-items:center;gap:10px;padding:10px 12px;border:1px solid ${v.navShopsBar};background:${v.navShopsBg};color:var(--paper);cursor:pointer`)}>
          <span style={s("font:600 20px/1 'IBM Plex Mono',monospace")}>{v.countShops}</span>
          <span style={s("font:600 13px 'IBM Plex Sans',sans-serif")}>Цеха</span>
        </button>
        <button onClick={v.navWorkers} style={s(`text-align:left;display:grid;grid-template-columns:38px 1fr;align-items:center;gap:10px;padding:10px 12px;border:1px solid ${v.navWorkersBar};background:${v.navWorkersBg};color:var(--paper);cursor:pointer`)}>
          <span style={s("font:600 20px/1 'IBM Plex Mono',monospace")}>{v.countWorkers}</span>
          <span style={s("font:600 13px 'IBM Plex Sans',sans-serif")}>Рабочие</span>
        </button>
        <button onClick={v.navTasks} style={s(`text-align:left;display:grid;grid-template-columns:38px 1fr;align-items:center;gap:10px;padding:10px 12px;border:1px solid ${v.navTasksBar};background:${v.navTasksBg};color:var(--paper);cursor:pointer`)}>
          <span style={s("font:600 20px/1 'IBM Plex Mono',monospace")}>{v.countTasks}</span>
          <span style={s("font:600 13px 'IBM Plex Sans',sans-serif")}>Задачи</span>
        </button>
      </div>
      <div style={s('margin-top:10px;border-top:1px solid rgba(var(--paper-rgb),.22);padding-top:12px')}>
        <div style={s("font:400 9.5px 'IBM Plex Mono',monospace;letter-spacing:.1em;color:rgba(var(--paper-rgb),.5)")}>СВОДКА СМЕНЫ</div>
        <div style={s('margin-top:9px;display:flex;height:8px;background:rgba(var(--paper-rgb),.16)')}>
          <span style={s(`width:${v.pctInWork};background:var(--accent-soft);display:inline-block`)}></span>
          <span style={s(`width:${v.pctNew};background:rgba(var(--paper-rgb),.4);display:inline-block`)}></span>
          <span style={s(`width:${v.pctDone};background:var(--ok-soft);display:inline-block`)}></span>
        </div>
        <div style={s("margin-top:11px;display:flex;flex-direction:column;gap:7px;font:400 12px/1.2 'IBM Plex Sans',sans-serif")}>
          <div style={s('display:flex;align-items:center;gap:8px')}><span style={s('width:8px;height:8px;background:var(--accent-soft);display:inline-block')}></span>В работе<span style={s("margin-left:auto;font-family:'IBM Plex Mono',monospace")}>{v.countInWork}</span></div>
          <div style={s('display:flex;align-items:center;gap:8px')}><span style={s('width:8px;height:8px;background:rgba(var(--paper-rgb),.4);display:inline-block')}></span>Новые<span style={s("margin-left:auto;font-family:'IBM Plex Mono',monospace")}>{v.countNew}</span></div>
          <div style={s('display:flex;align-items:center;gap:8px')}><span style={s('width:8px;height:8px;background:var(--ok-soft);display:inline-block')}></span>Выполнено<span style={s("margin-left:auto;font-family:'IBM Plex Mono',monospace")}>{v.countDone}</span></div>
        </div>
      </div>
      <div style={s("margin-top:auto;font:400 10.5px/1.6 'IBM Plex Mono',monospace;color:rgba(var(--paper-rgb),.45)")}>Смена 1 · 27.08.2026<br />Мастер Кузнецов А. В.</div>
    </div>
  )
}
