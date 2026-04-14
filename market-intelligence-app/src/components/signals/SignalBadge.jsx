export default function SignalBadge({ count }) {
  if (!count || count <= 0) return null;
  return (
    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-black bg-red-500 text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}
