/**
 * Nova Design System Preview — renders all tokens for visual verification.
 * Accessible at /design-system (dev only).
 */
import AccretionRing from '../components/nova/AccretionRing';

const PALETTE = [
  { name: 'Accreting', var: '--nova-accreting', light: '--nova-accreting-light', desc: 'Building, in progress' },
  { name: 'Ignited', var: '--nova-ignited', light: '--nova-ignited-light', desc: 'Ready, critical mass' },
  { name: 'Radiant', var: '--nova-radiant', light: '--nova-radiant-light', desc: 'Successful, landed' },
  { name: 'Cooling', var: '--nova-cooling', light: '--nova-cooling-light', desc: 'At risk, fading' },
  { name: 'Dormant', var: '--nova-dormant', light: '--nova-dormant-light', desc: 'Stale, inactive' },
  { name: 'Core', var: '--nova-core', light: '--nova-core-light', desc: 'Primary accent' },
];

const FOUNDATIONS = [
  { name: 'Primary', var: '--bg-primary' },
  { name: 'Secondary', var: '--bg-secondary' },
  { name: 'Surface', var: '--bg-surface' },
  { name: 'Card', var: '--bg-card' },
];

export default function DesignSystemPage() {
  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', padding: 32 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-hero)', color: 'var(--text-primary)', marginBottom: 8 }}>
        N<span style={{ letterSpacing: '-0.05em' }}>◎</span>va
      </h1>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', color: 'var(--text-secondary)', marginBottom: 48 }}>
        Scientific Luminance — Design System Preview
      </p>

      {/* ── Color Palette ── */}
      <section style={{ marginBottom: 48 }}>
        <h2 className="nova-label" style={{ marginBottom: 16 }}>Nova Palette</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {PALETTE.map(c => (
            <div key={c.name} className="nova-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ height: 48, background: `var(${c.var})` }} />
              <div style={{ height: 32, background: `var(${c.light})` }} />
              <div style={{ padding: 12 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{c.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{c.var}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 4 }}>{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Foundation Backgrounds ── */}
      <section style={{ marginBottom: 48 }}>
        <h2 className="nova-label" style={{ marginBottom: 16 }}>Foundation Backgrounds</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          {FOUNDATIONS.map(f => (
            <div key={f.name} style={{ flex: 1, height: 80, background: `var(${f.var})`, borderRadius: 'var(--card-l1-radius)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{f.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Accretion Rings ── */}
      <section style={{ marginBottom: 48 }}>
        <h2 className="nova-label" style={{ marginBottom: 16 }}>Accretion Rings</h2>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <AccretionRing value={0.3} size={72} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 8 }}>0.3 — Forming</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <AccretionRing value={0.6} size={72} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 8 }}>0.6 — Accreting</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <AccretionRing value={0.9} size={72} showGlow />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 8 }}>0.9 — Ignited</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <AccretionRing value={0.75} size={96} label="72" showGlow />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 8 }}>With label</div>
          </div>
        </div>
      </section>

      {/* ── Typography Scale ── */}
      <section style={{ marginBottom: 48 }}>
        <h2 className="nova-label" style={{ marginBottom: 16 }}>Typography</h2>
        <div className="nova-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <span className="nova-label">Display — Instrument Serif</span>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-hero)', color: 'var(--text-primary)', lineHeight: 1.1 }}>Nova Intelligence</div>
          </div>
          <div>
            <span className="nova-label">XL — Section Headers</span>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', color: 'var(--text-primary)' }}>Deal Health Dashboard</div>
          </div>
          <div>
            <span className="nova-label">LG — Card Titles</span>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)' }}>Discovery Play — Nordea Sweden</div>
          </div>
          <div>
            <span className="nova-label">Base — Body Text (DM Sans)</span>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', color: 'var(--text-secondary)' }}>Nova accretes intelligence layer by layer — each meeting, each signal, each research input — until the deal reaches critical mass and the path to winning becomes blindingly clear.</div>
          </div>
          <div>
            <span className="nova-label">SM — Secondary</span>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>3 stakeholders identified · 2 meetings logged · Discovery Play active</div>
          </div>
          <div>
            <span className="nova-label">Mono — Metrics (IBM Plex Mono)</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--text-primary)' }}>
              <span className="nova-score-enter" style={{ display: 'inline-block' }}>72</span>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginLeft: 8 }}>/ 100</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Signal Card Mockup ── */}
      <section style={{ marginBottom: 48 }}>
        <h2 className="nova-label" style={{ marginBottom: 16 }}>Signal Card (with glow animation)</h2>
        <div style={{ maxWidth: 480 }}>
          {/* Attention severity */}
          <div className="nova-card nova-signal-new" style={{ borderLeft: '3px solid var(--nova-accreting)', padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--nova-accreting)', display: 'inline-block' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>35M AGO</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--nova-accreting)', background: 'var(--nova-accreting-light)', padding: '2px 8px', borderRadius: 4 }}>ATTENTION</span>
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              Nordea Q1 earnings: digital costs +12%
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 8 }}>
              Transaction banking efficiency cited 3 times in earnings call
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--nova-core)', fontWeight: 500 }}>
              → Value Play · framework refresh queued
            </div>
          </div>

          {/* Urgent severity */}
          <div className="nova-card nova-pulse-urgent" style={{ borderLeft: '3px solid var(--nova-cooling)', padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--nova-cooling)', display: 'inline-block' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>JUST NOW</span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--nova-cooling)', background: 'var(--nova-cooling-light)', padding: '2px 8px', borderRadius: 4 }}>URGENT</span>
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              Champion departed: Kirsten Renner left Nordea
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Head of Group Technology role now vacant — deal risk elevated
            </div>
          </div>
        </div>
      </section>

      {/* ── Glow Comparison ── */}
      <section style={{ marginBottom: 48 }}>
        <h2 className="nova-label" style={{ marginBottom: 16 }}>Luminosity States</h2>
        <div style={{ display: 'flex', gap: 16 }}>
          {[
            { label: 'Default', className: 'nova-card' },
            { label: 'Accreting', className: 'nova-card nova-glow-accreting' },
            { label: 'Ignited', className: 'nova-card nova-glow-ignited' },
            { label: 'Radiant', className: 'nova-card nova-glow-radiant' },
            { label: 'Cooling', className: 'nova-card nova-glow-cooling' },
          ].map(g => (
            <div key={g.label} className={g.className} style={{ flex: 1, padding: 16, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{g.label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 4 }}>Glow state</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
