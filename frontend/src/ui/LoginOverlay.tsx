import { dc, s } from '@/design/style'
import { useV } from '@/model/context'

/** Оверлей входа: закрывает всё приложение, пока не авторизован. */
export function LoginOverlay() {
  const v = useV()
  if (!v.notAuthed) return null

  return (
    <div style={s('position:fixed;inset:0;z-index:120;background:var(--bg);display:flex;flex-direction:column')}>
      <div style={s('display:flex;align-items:center;gap:12px;padding:14px 20px;background:var(--ink);color:var(--paper)')}>
        <div style={s("font:700 16px/1 'IBM Plex Sans Condensed',sans-serif;letter-spacing:.06em")}>ЦЕХА · CRM</div>
      </div>
      <div style={s('flex:1;display:flex;align-items:center;justify-content:center;padding:44px')}>
        <form onSubmit={v.submitLogin} style={s('width:100%;max-width:330px;display:flex;flex-direction:column;gap:16px')}>
          <div>
            <div style={s("font:600 22px/1.2 'IBM Plex Sans',sans-serif")}>Вход в систему</div>
            <div style={s("margin-top:6px;font:400 12.5px 'IBM Plex Sans',sans-serif;color:var(--muted)")}>Введите логин и пароль</div>
          </div>
          <label style={s('display:flex;flex-direction:column;gap:6px')}>
            <span style={s("font:400 9.5px 'IBM Plex Mono',monospace;letter-spacing:.1em;color:var(--muted)")}>ЛОГИН</span>
            <input value={v.login} onChange={v.setLogin} autoComplete="username" style={s("font:500 14px 'IBM Plex Sans',sans-serif;padding:11px 12px;border:1px solid rgba(var(--ink-rgb),.45);background:var(--field);color:var(--ink)")} />
          </label>
          <label style={s('display:flex;flex-direction:column;gap:6px')}>
            <span style={s("font:400 9.5px 'IBM Plex Mono',monospace;letter-spacing:.1em;color:var(--muted)")}>ПАРОЛЬ</span>
            <input type="password" value={v.pass} onChange={v.setPass} autoComplete="current-password" style={s("font:500 14px 'IBM Plex Sans',sans-serif;padding:11px 12px;border:1px solid rgba(var(--ink-rgb),.45);background:var(--field);color:var(--ink)")} />
          </label>
          {v.authErr && (
            <div role="alert" style={s("display:flex;align-items:center;gap:9px;padding:9px 11px;background:rgba(var(--danger-rgb),.1);border:1px solid rgba(var(--danger-rgb),.4);font:500 12.5px 'IBM Plex Sans',sans-serif;color:var(--danger)")}>
              <span style={s('width:8px;height:8px;border-radius:50%;background:var(--danger);display:inline-block')}></span>{v.authErr}
            </div>
          )}
          <button type="submit" {...dc("font:600 14px 'IBM Plex Sans',sans-serif;padding:12px 0;border:1px solid var(--accent);background:var(--accent);color:var(--on-accent);cursor:pointer;transition:background .12s,border-color .12s,transform .06s", { hover: 'background:var(--accent-dark);border-color:var(--accent-dark)', active: 'transform:translateY(1px)' })}>{v.authBtn}</button>
          <div style={s("font:400 11.5px/1.5 'IBM Plex Sans',sans-serif;color:var(--faint)")}>Забыли пароль — обратитесь к администратору АСУ.</div>
        </form>
      </div>
    </div>
  )
}
