export default function DraftNotice({
  notice,
  onDiscard,
}: {
  notice: string;
  onDiscard: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 px-5 py-3 text-xs text-ink/65">
      <p role="status">
        {notice || "Draft recovery stays on this device."}{" "}
        <span>Clear your draft on shared devices.</span>
      </p>
      <button
        type="button"
        onClick={onDiscard}
        className="min-h-10 shrink-0 font-bold text-burgundy underline"
      >
        Clear draft
      </button>
    </div>
  );
}
