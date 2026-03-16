import { ChevronRight, Globe } from 'lucide-react';
import SelectableItem from '../SelectableItem';
import { ROLES } from '../../../data/discoveryQuestions';

export default function PeopleTab({
  bankKey,
  meetingActive,
  meetingContext,
  meetingTips,
  allPeople,
  topPeople,
  scrollToDeepDive,
}) {
  if (meetingActive) {
    return (
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          {meetingContext.attendees.map((a, i) => {
            const role = a.roleKey ? ROLES[a.roleKey] : null;
            const kdmData = allPeople.find(p => p.name === a.name);
            return (
              <div key={i} className="p-3 bg-primary-50 border-2 border-primary/30 rounded-lg ring-1 ring-primary/10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{role?.icon || '👤'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-primary font-bold uppercase tracking-wide">{role?.title || a.role}</div>
                    <div className="font-bold text-sm text-fg">
                      {a.name}
                      {a.linkedin && <a href={a.linkedin} target="_blank" rel="noopener" className="inline-flex ml-1 px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded text-[9px] font-bold text-blue-600 no-underline hover:bg-blue-100" onClick={e => e.stopPropagation()}>in</a>}
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-white">In Meeting</span>
                </div>
                {(kdmData?.note || a.note) && (
                  <p className="text-[10px] text-fg-muted mt-1 leading-relaxed">{kdmData?.note || a.note}</p>
                )}
                {role?.objective && (
                  <p className="text-[10px] text-primary/70 italic mt-1.5">
                    <span className="font-bold not-italic">Objective:</span> {role.objective}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {meetingTips.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-3">
            <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1.5">Meeting Tips</div>
            <div className="space-y-1.5">
              {meetingTips.map((tipGroup, i) => (
                <div key={i}>
                  <div className="text-[10px] font-bold text-amber-800">{tipGroup.roleIcon} For {tipGroup.roleTitle}:</div>
                  <ul className="mt-0.5 space-y-0.5">
                    {tipGroup.tips.map((tip, j) => (
                      <li key={j} className="text-[10px] text-amber-900/70 pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-amber-400">{tip}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {Object.entries(meetingContext.personResearch || {}).length > 0 && (
          <div className="space-y-2 mt-2">
            {Object.entries(meetingContext.personResearch).map(([name, research]) => (
              <div key={name} className="bg-violet-50/50 border border-violet-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Globe size={12} className="text-violet-600" />
                  <span className="text-[10px] font-bold text-violet-700 uppercase tracking-wider">AI Research: {name}</span>
                  {research._newsFound > 0 && (
                    <span className="text-[9px] text-violet-500">({research._newsFound} news mentions)</span>
                  )}
                </div>
                <p className="text-[11px] text-fg-subtle mb-2">{research.personSummary}</p>
                {research.likelyPriorities?.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[9px] font-bold text-violet-600 uppercase">Likely Priorities:</div>
                    {research.likelyPriorities.slice(0, 3).map((p, i) => (
                      <div key={i} className="bg-white rounded-md p-2 border border-violet-100">
                        <div className="text-[11px] font-bold text-fg">{p.priority}</div>
                        <div className="text-[10px] text-fg-subtle">{p.detail}</div>
                      </div>
                    ))}
                  </div>
                )}
                {research.suggestedApproach && (
                  <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-md p-2">
                    <div className="text-[9px] font-bold text-emerald-700">Suggested Approach</div>
                    <div className="text-[10px] text-emerald-800">{research.suggestedApproach}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {allPeople.filter(p => !meetingContext.attendees.some(a => a.name === p.name)).length > 0 && (
          <div className="mt-3">
            <div className="text-[9px] font-bold text-fg-disabled uppercase tracking-wider mb-1">Other Key People</div>
            <div className="flex flex-wrap gap-1.5">
              {allPeople.filter(p => !meetingContext.attendees.some(a => a.name === p.name)).slice(0, 6).map((p, i) => (
                <span key={i} className="text-[10px] text-fg-muted bg-surface-2 px-2 py-0.5 rounded">{p.name} — {p.role}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {topPeople.map((p, i) => {
          const isTarget = (p.note || '').includes('🎯') || (p.note || '').includes('CRITICAL') || (p.note || '').includes('KEY');
          return (
            <SelectableItem key={i} id={`person-${i}`} label={p.name} category="Key People" content={`**${p.name}** — ${p.role}${p.note ? '\n' + p.note : ''}${p.linkedin ? '\nLinkedIn: ' + p.linkedin : ''}`}>
              <div className={`p-3 border rounded-lg transition-all ${isTarget ? 'bg-primary-50 border-primary/30' : 'bg-surface border-border'}`}>
                <div className="text-[10px] text-fg-muted uppercase tracking-wide">{p.role}</div>
                <div className="font-bold text-sm text-fg mt-0.5">
                  {p.name} {isTarget && <span className="text-primary">🎯</span>}
                  {p.linkedin && <a href={p.linkedin} target="_blank" rel="noopener" className="inline-flex ml-1 px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded text-[9px] font-bold text-blue-600 no-underline hover:bg-blue-100" onClick={e => e.stopPropagation()}>in</a>}
                </div>
                {p.note && <p className="text-[10px] text-fg-disabled mt-1 line-clamp-2 hover:line-clamp-none transition-all">{p.note}</p>}
              </div>
            </SelectableItem>
          );
        })}
      </div>
      {allPeople.length > 4 && (
        <button onClick={() => scrollToDeepDive()} className="flex items-center gap-1 mt-2 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors">
          +{allPeople.length - 4} more people in Deep Dive <ChevronRight size={12} />
        </button>
      )}
    </div>
  );
}
