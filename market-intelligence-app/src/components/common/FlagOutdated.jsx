import { useState } from 'react';
import { Flag, X } from 'lucide-react';
import { getFlagsForBank, setFlag, removeFlag } from '../../data/metadata';

// "Flag as outdated" button — lets users mark specific sections as needing refresh
// Persisted to localStorage under 'mi-data-flags' key
export default function FlagOutdated({ bankKey, section, compact = false }) {
  const [flags, setFlags] = useState(() => getFlagsForBank(bankKey));
  const isFlag = !!flags[section];

  const toggle = (e) => {
    e.stopPropagation();
    if (isFlag) {
      const updated = removeFlag(bankKey, section);
      setFlags(getFlagsForBank(bankKey));
    } else {
      const updated = setFlag(bankKey, section, '');
      setFlags(getFlagsForBank(bankKey));
    }
  };

  if (compact) {
    return (
      <button
        onClick={toggle}
        className={`p-0.5 rounded transition-colors ${isFlag ? 'text-danger' : 'text-fg-disabled hover:text-danger/60'}`}
        title={isFlag ? 'Unflag — data has been verified' : 'Flag as potentially outdated'}
      >
        <Flag size={11} fill={isFlag ? 'currentColor' : 'none'} />
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border transition-all ${
        isFlag
          ? 'border-danger/30 bg-danger-subtle text-danger font-bold'
          : 'border-border text-fg-disabled hover:border-danger/30 hover:text-danger/60'
      }`}
      title={isFlag ? 'Click to unflag' : 'Flag this section as potentially outdated'}
    >
      <Flag size={10} fill={isFlag ? 'currentColor' : 'none'} />
      {isFlag ? 'Flagged' : 'Flag outdated'}
    </button>
  );
}
