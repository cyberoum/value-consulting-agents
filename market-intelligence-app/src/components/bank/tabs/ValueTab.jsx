import RoiSummaryCard from '../RoiSummaryCard';
import { ROLES } from '../../../data/discoveryQuestions';

export default function ValueTab({ bankKey, meetingActive, meetingContext, roiFraming, scrollToDeepDive }) {
  return (
    <div>
      {meetingActive && roiFraming && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-3">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">How to Frame ROI</span>
            <span className="text-[9px] text-amber-600">for {meetingContext.attendees.map(a => ROLES[a.roleKey]?.title || a.role).join(' + ')}</span>
          </div>
          <p className="text-[11px] text-amber-900/80 leading-relaxed">{roiFraming}</p>
        </div>
      )}
      <RoiSummaryCard bankKey={bankKey} onDeepDive={() => scrollToDeepDive()} />
    </div>
  );
}
