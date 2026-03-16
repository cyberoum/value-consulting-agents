import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'mi-section-feedback';

function loadFeedback() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveFeedback(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

export default function useFeedback() {
  const [feedback, setFeedback] = useState(loadFeedback);

  useEffect(() => {
    saveFeedback(feedback);
  }, [feedback]);

  // Get feedback for a specific section: 'up', 'down', or null
  const getFeedback = useCallback((sectionId) => {
    return feedback[sectionId] || null;
  }, [feedback]);

  // Toggle feedback — clicking same thumb removes it
  const setFeedbackFor = useCallback((sectionId, value) => {
    setFeedback(prev => {
      const next = { ...prev };
      if (next[sectionId] === value) {
        delete next[sectionId]; // toggle off
      } else {
        next[sectionId] = value; // set new value
      }
      return next;
    });
  }, []);

  // Get summary stats
  const stats = {
    total: Object.keys(feedback).length,
    up: Object.values(feedback).filter(v => v === 'up').length,
    down: Object.values(feedback).filter(v => v === 'down').length,
  };

  return { getFeedback, setFeedbackFor, stats };
}
