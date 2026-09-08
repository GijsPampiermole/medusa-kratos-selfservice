// ──────────────────────────────────────────────────────────────
// Medusa · Kratos — app shell / router
// ──────────────────────────────────────────────────────────────

const FLOW_LINKS = [
  ['login', 'Sign in'], ['register', 'Register'], ['recovery', 'Recovery'],
  ['verification', 'Verify email'], ['backup-codes', 'Backup codes'], ['settings', 'Account settings'],
];

function KratosApp() {
  const [theme, setTheme] = React.useState(() => localStorage.getItem('kratos_theme') || 'dark');
  const [flow, setFlow] = React.useState('login');
  const [ctx, setCtx] = React.useState(null);
  const [menu, setMenu] = React.useState(false);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('kratos_theme', theme); } catch {}
  }, [theme]);

  const go = (f, c) => { setCtx(c || null); setFlow(f); setMenu(false); window.scrollTo({ top: 0 }); };

  const isSettings = flow === 'settings';

  const screen = () => {
    switch (flow) {
      case 'login': return <LoginFlow go={go} />;
      case 'register': return <RegisterFlow go={go} />;
      case 'recovery': return <RecoveryFlow go={go} />;
      case 'verification': return <VerificationFlow go={go} ctx={ctx} />;
      case 'backup-codes': return <BackupCodesScreen go={go} />;
      case 'settings': return <AccountSettings go={go} />;
      default: return <LoginFlow go={go} />;
    }
  };

  return (
    <>
      {/* page chrome */}
      <div className="kchrome">
        {/* flow jumper (prototype nav) */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setMenu(m => !m)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, height: 38, padding: '0 14px', borderRadius: 999,
            background: 'var(--bg-2)', border: '0.5px solid var(--line-2)', color: 'var(--fg-1)', cursor: 'pointer',
            fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--accent-hi)' }} />
            {FLOW_LINKS.find(f => f[0] === flow)?.[1] || 'Flow'}
            <KIcon name="chevronDown" size={14} color="var(--fg-3)" />
          </button>
          {menu && (
            <>
              <div onClick={() => setMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
              <div className="fade-in" style={{ position: 'absolute', top: 44, left: 0, zIndex: 41, minWidth: 200,
                background: 'var(--bg-2)', border: '0.5px solid var(--line-2)', borderRadius: 14, padding: 6,
                boxShadow: '0 18px 44px -18px rgba(0,0,0,0.6)' }}>
                <div style={{ fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '7px 10px 5px' }}>Prototype flows</div>
                {FLOW_LINKS.map(([id, label]) => (
                  <button key={id} onClick={() => go(id)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 10,
                    padding: '9px 10px', borderRadius: 9, border: 0, cursor: 'pointer', fontFamily: 'inherit',
                    background: flow === id ? 'var(--accent-soft)' : 'transparent',
                    color: flow === id ? 'var(--accent-hi)' : 'var(--fg-1)', fontSize: 13.5, fontWeight: 500, textAlign: 'left' }}>
                    {label}
                    {flow === id && <KIcon name="check" size={15} color="var(--accent-hi)" strokeWidth={2.4} />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <ThemeToggle theme={theme} onToggle={() => setTheme(t => t === 'light' ? 'dark' : 'light')} />
      </div>

      {isSettings ? screen() : <div className="kauth">{screen()}</div>}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<KratosApp />);
