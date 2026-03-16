import DiscoveryPanel from '../DiscoveryPanel';
import { ROLES } from '../../../data/discoveryQuestions';

export default function DiscoveryQuestionsTab({ bankKey, meetingActive, tailoredQuestions, discoveryQuestions }) {
  return (
    <div>
      {meetingActive && tailoredQuestions ? (
        <>
          {tailoredQuestions.hint && (
            <div className="p-2.5 bg-primary-50 border border-primary/10 rounded-lg mb-3">
              <p className="text-[11px] text-primary/80 leading-relaxed">
                <span className="font-bold">Strategy:</span> {tailoredQuestions.hint}
              </p>
            </div>
          )}
          <div className="space-y-2 mb-3">
            {tailoredQuestions.questions.map((tq, i) => {
              const role = ROLES[tq.roleKey];
              return (
                <div key={i} className="p-3 bg-surface-2 border border-border rounded-lg">
                  <div className="flex items-start gap-2.5">
                    <span className="text-[10px] font-black text-primary bg-primary/10 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-sm">{role?.icon || '❓'}</span>
                        <span className="text-[9px] font-bold text-fg-disabled uppercase">{tq.phaseLabel}</span>
                        {tq.tag && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{tq.tag}</span>}
                      </div>
                      <p className="text-xs text-fg leading-relaxed font-medium">"{tq.question}"</p>
                      {tq.intent && <p className="text-[10px] text-fg-muted mt-1 italic">Intent: {tq.intent}</p>}
                      {tq.tip && <p className="text-[10px] text-primary/60 mt-0.5">Tip: {tq.tip}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : discoveryQuestions.length > 0 ? (
        <div className="space-y-1.5 mb-3">
          {discoveryQuestions.map((dq, i) => (
            <div key={i} className="flex gap-2.5 p-2.5 bg-surface-2 rounded-lg">
              <span className="text-[10px] font-black text-primary bg-primary/10 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              <span className="text-xs text-fg-subtle italic leading-relaxed">"{dq}"</span>
            </div>
          ))}
        </div>
      ) : null}

      {/* Full Discovery Playbook */}
      <div className="mt-4 pt-4 border-t border-border">
        <h4 className="text-sm font-bold text-fg mb-3">Full Discovery Playbook</h4>
        <DiscoveryPanel bankKey={bankKey} />
      </div>
    </div>
  );
}
