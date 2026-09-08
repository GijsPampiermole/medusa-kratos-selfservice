// ──────────────────────────────────────────────────────────────
// Medusa · Kratos — Account settings
// Responsive: desktop sidebar / mobile pill-nav. Single-section view.
// Sections: Profile · Password · 2FA Backup · Hardware Tokens ·
//           Passkeys · Authenticator App
// ──────────────────────────────────────────────────────────────

const SET_SECTIONS = [
  { id: 'profile', label: 'Profile', icon: 'user' },
  { id: 'password', label: 'Password', icon: 'lock' },
  { id: 'backup', label: '2FA Backup Codes', icon: 'shield' },
  { id: 'tokens', label: 'Hardware Tokens', icon: 'key' },
  { id: 'passkeys', label: 'Passkeys', icon: 'fingerprint' },
  { id: 'authenticator', label: 'Authenticator App', icon: 'smartphone' },
];

// Section heading inside the content area
function SectionHead({ title, sub }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>{title}</h2>
      {sub && <p style={{ fontSize: 13.5, color: 'var(--fg-2)', margin: '7px 0 0', lineHeight: 1.5 }}>{sub}</p>}
    </div>
  );
}

// A saved-state Save button that flips to "Saved ✓" briefly
function SaveButton({ label = 'Save', onSaved }) {
  const [state, setState] = React.useState('idle'); // idle | saving | saved
  const run = () => {
    setState('saving');
    setTimeout(() => { setState('saved'); onSaved && onSaved(); setTimeout(() => setState('idle'), 1700); }, 900);
  };
  return (
    <Button variant={state === 'saved' ? 'secondary' : 'primary'} loading={state === 'saving'} onClick={run}
      icon={state === 'saved' ? <KIcon name="check" size={17} color="var(--accent-hi)" /> : null}>
      {state === 'saved' ? 'Saved' : label}
    </Button>
  );
}

// ─── PROFILE ────────────────────────────────────────────────────
function ProfileSection() {
  const [email, setEmail] = React.useState('hello@gijspampiermole.nl');
  const [first, setFirst] = React.useState('Gijs');
  const [last, setLast] = React.useState('Pampiermole');
  const [touched, setTouched] = React.useState(false);
  const emailBad = touched && !isEmail(email);
  return (
    <div className="kset-card">
      <SectionHead title="Profile" sub="Update your personal details and contact email." />
      <Field label="Email" required error={emailBad ? 'Enter a valid email address' : null}>
        <TextField type="email" value={email} onChange={setEmail} invalid={emailBad}
          valid={!emailBad && isEmail(email)} onBlur={() => setTouched(true)} />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="First name"><TextField value={first} onChange={setFirst} /></Field>
        <Field label="Last name"><TextField value={last} onChange={setLast} /></Field>
      </div>
      <div style={{ marginTop: 6 }}><SaveButton /></div>
    </div>
  );
}

// ─── PASSWORD ───────────────────────────────────────────────────
function PasswordSection() {
  const [pw, setPw] = React.useState('');
  return (
    <div className="kset-card">
      <SectionHead title="Change password" sub="Choose a strong password. You may be asked to re-authenticate." />
      <Field label="New password" required>
        <PasswordField value={pw} onChange={setPw} placeholder="New password" autoComplete="new-password" />
        <StrengthMeter value={pw} />
      </Field>
      <div style={{ marginTop: 18 }}><SaveButton /></div>
    </div>
  );
}

// ─── 2FA BACKUP CODES ───────────────────────────────────────────
function BackupSection({ go }) {
  const [generated, setGenerated] = React.useState(true);
  return (
    <div className="kset-card">
      <SectionHead title="2FA backup recovery codes" sub="One-time codes to sign in if you lose your other 2FA methods." />
      {generated ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, background: 'var(--accent-soft)', border: '0.5px solid color-mix(in srgb, var(--accent-hi) 28%, transparent)', marginBottom: 18 }}>
          <KIcon name="checkCircle" size={20} color="var(--accent-hi)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Backup codes are active</div>
            <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 1 }}>8 codes · 0 used</div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => go('backup-codes')}>View codes</Button>
        </div>
      ) : (
        <div className="kchip-empty" style={{ marginBottom: 18 }}>
          <KIcon name="shield" size={24} color="var(--fg-3)" />
          No backup codes generated yet.
        </div>
      )}
      <Button variant="primary" icon={<KIcon name="refresh" size={17} color="#fff" />}
        onClick={() => { setGenerated(true); go('backup-codes'); }}>
        Generate new backup recovery codes
      </Button>
      {generated && <p style={{ fontSize: 12, color: 'var(--fg-3)', margin: '12px 0 0' }}>Generating new codes invalidates any existing set.</p>}
    </div>
  );
}

// ─── Credential row (tokens / passkeys) ─────────────────────────
function CredentialRow({ icon, name, meta, onRemove }) {
  return (
    <div className="krow" style={{ padding: '13px 15px', borderRadius: 12, background: 'var(--bg-1)', border: '0.5px solid var(--line-2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'var(--bg-3)', border: '0.5px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <KIcon name={icon} size={18} color="var(--accent-hi)" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
          <div className="num" style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 1 }}>{meta}</div>
        </div>
      </div>
      <button className="ktrail" style={{ position: 'static', width: 34, height: 34 }} onClick={onRemove} aria-label="Remove">
        <KIcon name="trash" size={16} color="var(--fg-3)" />
      </button>
    </div>
  );
}

// ─── HARDWARE TOKENS ────────────────────────────────────────────
function TokensSection() {
  const [name, setName] = React.useState('');
  const [tokens, setTokens] = React.useState([{ id: 1, name: 'YubiKey 5C', meta: 'Added 12 Mar 2026' }]);
  const [adding, setAdding] = React.useState(false);
  const add = () => {
    if (!name.trim()) return;
    setAdding(true);
    setTimeout(() => { setTokens(t => [...t, { id: Date.now(), name: name.trim(), meta: 'Added just now' }]); setName(''); setAdding(false); }, 1100);
  };
  return (
    <div className="kset-card">
      <SectionHead title="Hardware tokens" sub="Manage WebAuthn security keys (e.g. YubiKey) registered to your account." />
      {tokens.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {tokens.map(t => <CredentialRow key={t.id} icon="key" name={t.name} meta={t.meta} onRemove={() => setTokens(x => x.filter(y => y.id !== t.id))} />)}
        </div>
      )}
      <Field label="Name of the security key">
        <TextField value={name} onChange={setName} placeholder="e.g. Personal YubiKey" />
      </Field>
      <Button variant="primary" loading={adding} icon={<KIcon name="plus" size={17} color="#fff" />} onClick={add}>Add security key</Button>
    </div>
  );
}

// ─── PASSKEYS ───────────────────────────────────────────────────
function PasskeysSection() {
  const [keys, setKeys] = React.useState([
    { id: 1, name: 'iPhone 15 Pro', meta: 'Synced · iCloud Keychain' },
    { id: 2, name: 'MacBook Pro', meta: 'This device · Touch ID' },
  ]);
  const [adding, setAdding] = React.useState(false);
  const add = () => { setAdding(true); setTimeout(() => { setKeys(k => [...k, { id: Date.now(), name: 'New passkey', meta: 'Added just now' }]); setAdding(false); }, 1300); };
  return (
    <div className="kset-card">
      <SectionHead title="Passkeys" sub="Sign in without a password using your device's biometrics." />
      {keys.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {keys.map(k => <CredentialRow key={k.id} icon="fingerprint" name={k.name} meta={k.meta} onRemove={() => setKeys(x => x.filter(y => y.id !== k.id))} />)}
        </div>
      ) : (
        <div className="kchip-empty" style={{ marginBottom: 20 }}>
          <KIcon name="fingerprint" size={24} color="var(--fg-3)" />
          No passkeys yet. Add one for faster, safer sign-in.
        </div>
      )}
      <Button variant="primary" loading={adding} icon={<KIcon name="plus" size={17} color="#fff" />} onClick={add}>Add passkey</Button>
    </div>
  );
}

// ─── AUTHENTICATOR APP ──────────────────────────────────────────
// deterministic QR-ish grid (placeholder, not a real code)
function FakeQR({ n = 21 }) {
  const cells = React.useMemo(() => {
    const arr = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const finder = (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
      const ring = finder && !((x >= 2 && x <= 4 && y >= 2 && y <= 4) || (x >= n - 5 && x <= n - 3 && y >= 2 && y <= 4) || (x >= 2 && x <= 4 && y >= n - 5 && y <= n - 3));
      const edge = finder && (x === 0 || x === 6 || y === 0 || y === 6 || x === n - 1 || x === n - 7 || y === n - 1 || y === n - 7);
      const on = finder ? (ring ? edge || ((x >= 2 && x <= 4) && (y >= 2 && y <= 4)) || ((x >= n - 5 && x <= n - 3) && (y >= 2 && y <= 4)) || ((x >= 2 && x <= 4) && (y >= n - 5 && y <= n - 3)) : false)
        : ((x * 7 + y * 13 + x * y) % 3 === 0);
      arr.push(on);
    }
    return arr;
  }, [n]);
  return (
    <div className="kqr" style={{ gridTemplateColumns: `repeat(${n}, 1fr)`, gridTemplateRows: `repeat(${n}, 1fr)` }}>
      {cells.map((on, i) => <i key={i} className={on ? '' : 'off'} />)}
    </div>
  );
}
function AuthenticatorSection() {
  const [code, setCode] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const secret = 'JBSW Y3DP EHPK 3PXP';
  return (
    <div className="kset-card">
      <SectionHead title="Authenticator app (TOTP)" sub="Scan the QR code with an authenticator app, then enter the generated code to confirm." />
      <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div>
          <div className="klabel" style={{ marginBottom: 10 }}>Authenticator QR code</div>
          <FakeQR />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div className="klabel" style={{ marginBottom: 8 }}>Or enter this secret manually</div>
          <div className="krow" style={{ padding: '12px 14px', borderRadius: 11, background: 'var(--bg-1)', border: '0.5px solid var(--line-2)' }}>
            <span className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 14, letterSpacing: '0.08em', color: 'var(--fg-1)' }}>{secret}</span>
            <button className="ktrail" style={{ position: 'static', width: 32, height: 32 }} onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1600); }} aria-label="Copy secret">
              <KIcon name={copied ? 'check' : 'copy'} size={16} color={copied ? 'var(--accent-hi)' : 'var(--fg-3)'} />
            </button>
          </div>
          <div style={{ marginTop: 18 }}>
            <Field label="Verify code" required>
              <TextField value={code} onChange={v => setCode(v.replace(/\D/g, '').slice(0, 6))} placeholder="123456" inputMode="numeric" />
            </Field>
            <SaveButton label="Confirm & enable" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SETTINGS SHELL ─────────────────────────────────────────────
function AccountSettings({ go }) {
  const [active, setActive] = React.useState('profile');
  const renderSection = () => {
    switch (active) {
      case 'profile': return <ProfileSection />;
      case 'password': return <PasswordSection />;
      case 'backup': return <BackupSection go={go} />;
      case 'tokens': return <TokensSection />;
      case 'passkeys': return <PasskeysSection />;
      case 'authenticator': return <AuthenticatorSection />;
      default: return null;
    }
  };
  return (
    <div className="kset">
      {/* Desktop sidebar */}
      <aside className="kset-nav">
        <div style={{ padding: '0 13px 14px' }}>
          <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em' }}>Account</div>
          <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 2 }}>Manage your account</div>
        </div>
        <button className="knav-item" onClick={() => go('login')} style={{ marginBottom: 6 }}>
          <span className="knav-ico"><KIcon name="arrowLeft" size={18} /></span> Back
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {SET_SECTIONS.map(s => (
            <button key={s.id} className={'knav-item' + (active === s.id ? ' active' : '')} onClick={() => setActive(s.id)}>
              <span className="knav-ico"><KIcon name={s.icon} size={18} /></span> {s.label}
            </button>
          ))}
        </div>
        <div className="kdivline" style={{ margin: '14px 13px' }} />
        <button className="knav-item" onClick={() => go('login')} style={{ color: 'var(--crit)' }}>
          <span className="knav-ico" style={{ color: 'var(--crit)' }}><KIcon name="logout" size={18} /></span> Logout
        </button>
      </aside>

      {/* Mobile pill nav */}
      <nav className="kset-mobnav">
        {SET_SECTIONS.map(s => (
          <button key={s.id} className={'kmob-item' + (active === s.id ? ' active' : '')} onClick={() => setActive(s.id)}>
            <KIcon name={s.icon} size={14} color={active === s.id ? '#fff' : 'var(--fg-3)'} /> {s.label}
          </button>
        ))}
      </nav>

      <main className="kset-main">
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em', margin: 0 }}>Account settings</h1>
          <p style={{ fontSize: 13.5, color: 'var(--fg-2)', margin: '8px 0 0', lineHeight: 1.5 }}>
            Manage settings related to your account. Certain actions require you to re-authenticate.
          </p>
        </div>
        <div className="kset-sect" key={active}>{renderSection()}</div>
      </main>
    </div>
  );
}

Object.assign(window, {
  AccountSettings, SET_SECTIONS, ProfileSection, PasswordSection, BackupSection,
  TokensSection, PasskeysSection, AuthenticatorSection, FakeQR,
});
