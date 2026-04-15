import { Zap, Building2, Users, Target } from 'lucide-react';

const SECTIONS = [
  { id: 'snapshot',     label: 'Account Snapshot',     icon: Zap },
  { id: 'business',     label: 'Business Overview',    icon: Building2 },
  { id: 'stakeholders', label: 'Stakeholder Map',      icon: Users },
  { id: 'objectives',   label: 'Strategic Objectives', icon: Target },
];

/**
 * Sticky left sidebar with active-section highlighting.
 * Uses scroll-spy: parent wires `activeSection` via IntersectionObserver.
 */
export default function AccountPlanSidebar({ activeSection, onNavigate }) {
  return (
    <aside className="lg:w-52 shrink-0">
      <nav className="lg:sticky lg:top-20 space-y-1">
        <div className="nova-label mb-2">Account Plan</div>
        {SECTIONS.map(s => {
          const Icon = s.icon;
          const active = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onNavigate?.(s.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                active
                  ? 'bg-[var(--nova-core-light)] text-[var(--nova-core)] font-bold'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              <Icon size={14} className="shrink-0" />
              <span className="text-xs">{s.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export { SECTIONS };
