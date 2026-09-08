// ──────────────────────────────────────────────────────────────
// Medusa · Kratos — auth flows
// Login · Register · Recovery · Verification · Backup codes
// All clickable; inline validation + simulated async + loading.
// ──────────────────────────────────────────────────────────────

// ─── LOGIN ──────────────────────────────────────────────────────
function LoginFlow({ go }) {
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [touched, setTouched] = React.useState(false);
  const [err, setErr] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [passkeyBusy, setPasskeyBusy] = React.useState(false);
  const [ssoBusy, setSsoBusy] = React.useState(null);

  const emailBad = touched && !isEmail(email);

  const submit = () => {
    setTouched(true); setErr(null);
    if (!isEmail(email) || !pw) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // demo: wrong password unless it's "password"
      if (pw !== 'password') setErr('The email or password you entered is incorrect.');
      else go('verification', { email });
    }, 1100);
  };
  const passkey = () => { setPasskeyBusy(true); setTimeout(() => { setPasskeyBusy(false); go('settings'); }, 1400); };
  const sso = (id) => { setSsoBusy(id); setTimeout(() => { setSsoBusy(null); go('settings'); }, 1200); };

  return (
    <div className="kcard kcard-enter">
      <CardTitle title="Sign in" sub="Welcome back. Continue to your account." center />

      {err && <Alert kind="error" onClose={() => setErr(null)}>{err}</Alert>}

      <Button variant="secondary" full icon={<KIcon name="fingerprint" size={19} color="var(--accent-hi)" />}
        loading={passkeyBusy} onClick={passkey}>Sign in with passkey</Button>

      <Divider />

      <Field label="Email" required error={emailBad ? 'Enter a valid email address' : null} htmlFor="login-email">
        <TextField id="login-email" type="email" inputMode="email" autoComplete="username"
          value={email} onChange={setEmail} placeholder="you@example.com"
          invalid={emailBad} valid={touched && isEmail(email)} onBlur={() => setTouched(true)} />
      </Field>

      <Field label="Password" required htmlFor="login-pw">
        <PasswordField id="login-pw" value={pw} onChange={setPw} placeholder="••••••••" invalid={!!err} />
      </Field>

      <div style={{ margin: '-6px 0 20px' }}>
        <button className="klink" onClick={() => go('recovery')}>Forgot password?</button>
      </div>

      <Button variant="primary" full loading={loading} onClick={submit}>Sign in with password</Button>

      <Divider label="or continue with" />
      <SSORow onPick={sso} busy={ssoBusy} />

      <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13.5, color: 'var(--fg-2)' }}>
        Don't have an account? <button className="klink" onClick={() => go('register')}>Sign up</button>
      </div>

      <AuthFooter />
    </div>
  );
}

// ─── REGISTER ───────────────────────────────────────────────────
function RegisterFlow({ go }) {
  const [email, setEmail] = React.useState('');
  const [first, setFirst] = React.useState('');
  const [last, setLast] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [touched, setTouched] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [ssoBusy, setSsoBusy] = React.useState(null);

  const emailBad = touched && !isEmail(email);
  const pwBad = touched && scorePassword(pw).score < 2;

  const submit = () => {
    setTouched(true);
    if (!isEmail(email) || scorePassword(pw).score < 2) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); go('verification', { email, fresh: true }); }, 1200);
  };
  const sso = (id) => { setSsoBusy(id); setTimeout(() => { setSsoBusy(null); go('settings'); }, 1200); };

  return (
    <div className="kcard kcard-enter">
      <CardTitle title="Register an account" sub="Create your account to get started." center />

      <SSORow onPick={sso} busy={ssoBusy} />
      <Divider label="or sign up with email" />

      <Field label="Email" required error={emailBad ? 'Enter a valid email address' : null} htmlFor="reg-email">
        <TextField id="reg-email" type="email" inputMode="email" autoComplete="email"
          value={email} onChange={setEmail} placeholder="you@example.com"
          invalid={emailBad} valid={touched && isEmail(email)} />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="First name" htmlFor="reg-first">
          <TextField id="reg-first" value={first} onChange={setFirst} placeholder="Jane" autoComplete="given-name" />
        </Field>
        <Field label="Last name" htmlFor="reg-last">
          <TextField id="reg-last" value={last} onChange={setLast} placeholder="Doe" autoComplete="family-name" />
        </Field>
      </div>

      <Field label="Password" required error={pwBad ? 'Choose a stronger password' : null} htmlFor="reg-pw">
        <PasswordField id="reg-pw" value={pw} onChange={setPw} placeholder="Create a password" invalid={pwBad} autoComplete="new-password" />
        <StrengthMeter value={pw} />
      </Field>

      <div style={{ marginTop: 22 }}>
        <Button variant="primary" full loading={loading} onClick={submit}>Sign up</Button>
      </div>

      <div style={{ textAlign: 'center', marginTop: 22, fontSize: 13.5, color: 'var(--fg-2)' }}>
        Already have an account? <button className="klink" onClick={() => go('login')}>Sign in</button>
      </div>

      <AuthFooter />
    </div>
  );
}

// ─── OTP input (shared by recovery + verification) ──────────────
function OtpInput({ length = 6, value, onChange }) {
  const refs = React.useRef([]);
  const set = (i, v) => {
    const d = v.replace(/\D/g, '').slice(-1);
    const arr = value.split('');
    arr[i] = d; const next = arr.join('').slice(0, length);
    onChange(next);
    if (d && i < length - 1) refs.current[i + 1]?.focus();
  };
  const key = (i, e) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) refs.current[i - 1]?.focus();
  };
  const paste = (e) => {
    e.preventDefault();
    const d = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, length);
    onChange(d); refs.current[Math.min(d.length, length - 1)]?.focus();
  };
  return (
    <div className="kotp" onPaste={paste}>
      {Array.from({ length }).map((_, i) => (
        <input key={i} ref={el => refs.current[i] = el} inputMode="numeric" maxLength={1}
          className={value[i] ? 'filled' : ''} value={value[i] || ''}
          onChange={e => set(i, e.target.value)} onKeyDown={e => key(i, e)} autoFocus={i === 0} />
      ))}
    </div>
  );
}

// ─── RECOVERY (forgot password) ─────────────────────────────────
function RecoveryFlow({ go }) {
  const [stage, setStage] = React.useState('email'); // email → code → reset → done
  const [email, setEmail] = React.useState('');
  const [touched, setTouched] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState(null);

  const emailBad = touched && !isEmail(email);

  const sendCode = () => {
    setTouched(true); if (!isEmail(email)) return;
    setLoading(true); setTimeout(() => { setLoading(false); setStage('code'); }, 1000);
  };
  const verify = () => {
    setErr(null); if (code.length < 6) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); if (code === '000000') setErr('That code is invalid or expired.'); else setStage('reset'); }, 1000);
  };
  const reset = () => {
    if (scorePassword(pw).score < 2) return;
    setLoading(true); setTimeout(() => { setLoading(false); setStage('done'); }, 1000);
  };

  return (
    <div className="kcard kcard-enter">
      <button className="klink" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 18 }}
        onClick={() => stage === 'email' ? go('login') : setStage('email')}>
        <KIcon name="arrowLeft" size={15} /> Back
      </button>

      {stage === 'email' && (<>
        <CardTitle title="Reset your password" sub="Enter your account email and we'll send a recovery code." />
        {err && <Alert kind="error">{err}</Alert>}
        <Field label="Email" required error={emailBad ? 'Enter a valid email address' : null}>
          <TextField type="email" inputMode="email" value={email} onChange={setEmail}
            placeholder="you@example.com" invalid={emailBad} valid={touched && isEmail(email)} autoFocus />
        </Field>
        <Button variant="primary" full loading={loading} onClick={sendCode}>Send recovery code</Button>
      </>)}

      {stage === 'code' && (<>
        <CardTitle title="Enter recovery code" sub={<>We sent a 6-digit code to <strong style={{ color: 'var(--fg-1)' }}>{email}</strong>.</>} />
        {err && <Alert kind="error">{err}</Alert>}
        <div style={{ margin: '6px 0 20px' }}><OtpInput value={code} onChange={setCode} /></div>
        <Button variant="primary" full loading={loading} disabled={code.length < 6} onClick={verify}>Verify code</Button>
        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--fg-2)' }}>
          Didn't get it? <button className="klink" onClick={() => { setCode(''); }}>Resend code</button>
        </div>
      </>)}

      {stage === 'reset' && (<>
        <CardTitle title="Choose a new password" sub="Make it strong — you won't need to remember the old one." />
        <Field label="New password" required>
          <PasswordField value={pw} onChange={setPw} placeholder="New password" autoComplete="new-password" autoFocus />
          <StrengthMeter value={pw} />
        </Field>
        <div style={{ marginTop: 22 }}>
          <Button variant="primary" full loading={loading} onClick={reset}>Update password</Button>
        </div>
      </>)}

      {stage === 'done' && (<>
        <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          <div style={{ width: 58, height: 58, margin: '0 auto 16px', borderRadius: '50%', background: 'var(--accent-soft)', border: '0.5px solid color-mix(in srgb, var(--accent-hi) 36%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <KIcon name="check" size={26} color="var(--accent-hi)" strokeWidth={2.4} />
          </div>
          <CardTitle title="Password updated" sub="You can now sign in with your new password." center />
          <Button variant="primary" full onClick={() => go('login')}>Back to sign in</Button>
        </div>
      </>)}

      <AuthFooter />
    </div>
  );
}

// ─── VERIFICATION (email code) ──────────────────────────────────
function VerificationFlow({ go, ctx }) {
  const email = (ctx && ctx.email) || 'you@example.com';
  const [code, setCode] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState(null);
  const [done, setDone] = React.useState(false);
  const [resent, setResent] = React.useState(false);

  const verify = () => {
    setErr(null); if (code.length < 6) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); if (code === '000000') setErr('That code is invalid or expired.'); else setDone(true); }, 1000);
  };

  if (done) {
    return (
      <div className="kcard kcard-enter">
        <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          <div style={{ width: 58, height: 58, margin: '0 auto 16px', borderRadius: '50%', background: 'var(--accent-soft)', border: '0.5px solid color-mix(in srgb, var(--accent-hi) 36%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <KIcon name="shield" size={26} color="var(--accent-hi)" strokeWidth={2} />
          </div>
          <CardTitle title="Email verified" sub="Your address is confirmed. Welcome aboard." center />
          <Button variant="primary" full onClick={() => go('settings')}>Continue</Button>
        </div>
        <AuthFooter />
      </div>
    );
  }

  return (
    <div className="kcard kcard-enter">
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <div style={{ width: 52, height: 52, margin: '0 auto 16px', borderRadius: 15, background: 'var(--bg-3)', border: '0.5px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <KIcon name="mail" size={24} color="var(--accent-hi)" />
        </div>
      </div>
      <CardTitle title="Verify your email" sub={<>Enter the 6-digit code we sent to <strong style={{ color: 'var(--fg-1)' }}>{email}</strong>.</>} center />

      {err && <Alert kind="error">{err}</Alert>}
      {resent && <Alert kind="success">A new code is on its way.</Alert>}

      <div style={{ margin: '8px 0 22px' }}><OtpInput value={code} onChange={setCode} /></div>

      <Button variant="primary" full loading={loading} disabled={code.length < 6} onClick={verify}>Verify email</Button>

      <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--fg-2)' }}>
        Didn't receive it? <button className="klink" onClick={() => { setResent(true); setCode(''); }}>Resend code</button>
      </div>
      <div style={{ textAlign: 'center', marginTop: 10 }}>
        <button className="klink" style={{ color: 'var(--fg-3)' }} onClick={() => go('login')}>Use a different account</button>
      </div>

      <AuthFooter />
    </div>
  );
}

// ─── BACKUP CODES display ───────────────────────────────────────
const SAMPLE_CODES = ['4f9a-2c71', '8b3e-1d09', 'a07c-66f4', '21be-9e8d', 'c4d5-3a12', 'e9f0-7b6a', '5a2c-08de', 'f1b8-4c93'];
function BackupCodesScreen({ go, embedded, onClose }) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => { setCopied(true); setTimeout(() => setCopied(false), 1800); };

  const body = (
    <>
      <CardTitle title="Your backup codes"
        sub="Store these somewhere safe. Each code can be used once if you lose access to your other methods." />
      <Alert kind="info">Treat these like passwords. They won't be shown in full again.</Alert>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '4px 0 20px' }}>
        {SAMPLE_CODES.map((c, i) => (
          <div key={c} className="num" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 11, background: 'var(--bg-1)', border: '0.5px solid var(--line-2)', fontFamily: 'var(--font-mono)', fontSize: 14, letterSpacing: '0.02em', color: 'var(--fg-1)' }}>
            <span style={{ color: 'var(--fg-4)', fontSize: 11, width: 16 }}>{i + 1}</span>{c}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="secondary" full icon={<KIcon name={copied ? 'check' : 'copy'} size={17} color={copied ? 'var(--accent-hi)' : 'var(--fg-2)'} />} onClick={copy}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
        <Button variant="secondary" full icon={<KIcon name="download" size={17} color="var(--fg-2)" />}>Download</Button>
      </div>
    </>
  );

  if (embedded) return <div>{body}<div style={{ marginTop: 18 }}><Button variant="primary" full onClick={onClose}>I've saved them</Button></div></div>;

  return (
    <div className="kcard kcard-enter">
      <button className="klink" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 18 }} onClick={() => go('settings')}>
        <KIcon name="arrowLeft" size={15} /> Back to settings
      </button>
      {body}
      <div style={{ marginTop: 18 }}><Button variant="primary" full onClick={() => go('settings')}>Done</Button></div>
    </div>
  );
}

Object.assign(window, {
  LoginFlow, RegisterFlow, OtpInput, RecoveryFlow, VerificationFlow, BackupCodesScreen, SAMPLE_CODES,
});
