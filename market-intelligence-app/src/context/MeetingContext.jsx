import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';

const INITIAL_STATE = {
  attendees: [], scopeKnown: 'unknown', painPointKnown: 'unknown',
  scopeText: '', painText: '', personResearch: {}, contextEnrichment: null,
  topics: [], meetingPrepBrief: null,
};

const MeetingContext = createContext(null);

export function MeetingProvider({ bankKey, children }) {
  const [meetingContext, setMeetingContext] = useState(INITIAL_STATE);

  // Reset when navigating to a different bank
  useEffect(() => {
    setMeetingContext(INITIAL_STATE);
  }, [bankKey]);

  // Supports both direct value and functional updater: update(prev => ({...prev, ...}))
  const updateContext = useCallback((update) => {
    if (typeof update === 'function') {
      setMeetingContext(prev => update(prev));
    } else {
      setMeetingContext(update);
    }
  }, []);

  const meetingActive = meetingContext.attendees.length > 0;

  const meetingRoleKeys = useMemo(() => {
    return [...new Set(meetingContext.attendees.map(a => a.roleKey).filter(Boolean))];
  }, [meetingContext.attendees]);

  const value = useMemo(() => ({
    meetingContext,
    updateContext,
    meetingActive,
    meetingRoleKeys,
  }), [meetingContext, updateContext, meetingActive, meetingRoleKeys]);

  return (
    <MeetingContext.Provider value={value}>
      {children}
    </MeetingContext.Provider>
  );
}

export function useMeeting() {
  const ctx = useContext(MeetingContext);
  if (!ctx) throw new Error('useMeeting must be used within a MeetingProvider');
  return ctx;
}
