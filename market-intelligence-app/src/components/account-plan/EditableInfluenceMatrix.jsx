import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MEDDICC_ROLES, ENGAGEMENT_STATUSES, ENGAGEMENT_META, coordsToPosition, positionToCoords } from './constants';

/**
 * EditableInfluenceMatrix — 2x2 MEDDICC map with drag-and-drop.
 *
 * X-axis: engagement status (champion → blocker, left → right)
 * Y-axis: influence score (1 → 10, bottom → top)
 *
 * Each person is a motion.div bubble. Dragging updates influence_score + engagement_status
 * via the onMove callback (parent handles the optimistic API PATCH).
 *
 * Bubble size = influence score. Bubble color = primary MEDDICC role color,
 * or falls back to engagement status color if no MEDDICC roles assigned.
 */

const CONTAINER_HEIGHT = 400;
const BUBBLE_MIN_SIZE = 28;
const BUBBLE_MAX_SIZE = 56;

function bubbleSize(score) {
  const normalized = (Math.max(1, Math.min(10, score || 5)) - 1) / 9;
  return BUBBLE_MIN_SIZE + normalized * (BUBBLE_MAX_SIZE - BUBBLE_MIN_SIZE);
}

function primaryRoleColor(person) {
  const roles = Array.isArray(person.meddicc_roles) ? person.meddicc_roles : [];
  if (roles.length > 0 && MEDDICC_ROLES[roles[0]]) {
    return MEDDICC_ROLES[roles[0]].color;
  }
  // Fall back to engagement status color
  const status = person.engagement_status || 'neutral';
  return ENGAGEMENT_META[status]?.color || '#64748B';
}

function PersonBubble({ person, containerSize, onMove, onSelect, isSelected }) {
  const size = bubbleSize(person.influence_score);
  const color = primaryRoleColor(person);

  // Translate data coords → pixel position
  const { x, y } = positionToCoords(
    person.influence_score || 5,
    person.engagement_status || 'neutral',
    containerSize.width,
    containerSize.height
  );

  // framer-motion drag: we use drag constraints to keep it in the matrix, then
  // on release, read the current position and translate back to influence+engagement.
  const handleDragEnd = (e, info) => {
    // info.point is viewport coords; translate to container-local
    // We need the container bounding rect for accurate translation.
    const ref = e.target?.parentElement; // bubble's container is the matrix
    // Fallback: use offset + original position + delta
    const finalX = x + info.offset.x;
    const finalY = y + info.offset.y;
    const clampedX = Math.max(0, Math.min(containerSize.width, finalX));
    const clampedY = Math.max(0, Math.min(containerSize.height, finalY));
    const { influence_score, engagement_status } = coordsToPosition(
      clampedX, clampedY, containerSize.width, containerSize.height
    );
    onMove?.(person.id, { influence_score, engagement_status });
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      onDragEnd={handleDragEnd}
      onClick={() => onSelect?.(person)}
      whileHover={{ scale: 1.1 }}
      whileDrag={{ scale: 1.15, zIndex: 50 }}
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        backgroundColor: color,
        cursor: 'grab',
        boxShadow: isSelected
          ? `0 0 0 3px white, 0 0 0 5px ${color}, 0 4px 12px rgba(0,0,0,0.2)`
          : '0 2px 8px rgba(0,0,0,0.15)',
      }}
      className="rounded-full flex items-center justify-center text-white font-black text-[10px] select-none"
      title={`${person.canonical_name} — Influence ${person.influence_score || '?'}, ${person.engagement_status || 'neutral'}`}
    >
      {(person.canonical_name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
    </motion.div>
  );
}

export default function EditableInfluenceMatrix({ persons = [], selectedId, onMove, onSelect }) {
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 600, height: CONTAINER_HEIGHT });

  // Measure container on mount + resize
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: CONTAINER_HEIGHT });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return (
    <div className="relative">
      {/* Y-axis label */}
      <div className="flex">
        <div className="flex flex-col items-center justify-between pr-2 text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider"
          style={{ height: CONTAINER_HEIGHT, writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
          <span>High Influence</span>
          <span>Low Influence</span>
        </div>

        {/* Matrix */}
        <div
          ref={containerRef}
          className="relative flex-1 bg-[var(--bg-secondary)] rounded-[var(--il-radius)] border border-[var(--border-default)] overflow-hidden"
          style={{ height: CONTAINER_HEIGHT }}
        >
          {/* Quadrant grid lines */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-[var(--border-default)]" />
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[var(--border-default)]" />
          </div>

          {/* Quadrant labels (top-left corner of each quadrant) */}
          <div className="absolute top-2 left-2 text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider pointer-events-none">
            Supporters (high influence)
          </div>
          <div className="absolute top-2 right-2 text-[9px] font-bold text-[var(--nova-cooling)] uppercase tracking-wider pointer-events-none text-right">
            Blockers (high influence)
          </div>
          <div className="absolute bottom-2 left-2 text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider pointer-events-none">
            Low-priority allies
          </div>
          <div className="absolute bottom-2 right-2 text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider pointer-events-none text-right">
            Low-priority blockers
          </div>

          {/* Engagement column markers (vertical dashed lines at each status bucket boundary) */}
          {ENGAGEMENT_STATUSES.slice(1).map((_, i) => (
            <div key={i}
              className="absolute top-0 bottom-0 w-px border-l border-dashed border-[var(--border-subtle)] pointer-events-none"
              style={{ left: `${((i + 1) / ENGAGEMENT_STATUSES.length) * 100}%` }}
            />
          ))}

          {/* Bubbles */}
          {persons.map(p => (
            <PersonBubble
              key={p.id}
              person={p}
              containerSize={containerSize}
              onMove={onMove}
              onSelect={onSelect}
              isSelected={selectedId === p.id}
            />
          ))}
        </div>
      </div>

      {/* X-axis legend */}
      <div className="flex ml-8 mt-2 justify-between text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
        {ENGAGEMENT_STATUSES.map(s => (
          <div key={s} className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ENGAGEMENT_META[s].color }} />
            {ENGAGEMENT_META[s].label}
          </div>
        ))}
      </div>

      {/* Helper hint */}
      {persons.length > 0 && (
        <p className="text-[10px] text-[var(--text-muted)] italic mt-2 text-center">
          Drag a stakeholder to reposition them. Click to see details.
        </p>
      )}

      {/* Empty state */}
      {persons.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-xs text-[var(--text-muted)]">No stakeholders yet. Click "Add Person" to begin.</p>
        </div>
      )}
    </div>
  );
}
