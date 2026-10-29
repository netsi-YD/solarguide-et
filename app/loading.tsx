export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 py-16 text-center"
    >
      <div className="size-8 animate-spin rounded-full border-3 border-amber-200 border-t-amber-600" />
      <p className="text-sm font-medium text-slate-600">
        የሶላር መጠን እና የዋጋ ግምት በማስላት ላይ... / Loading...
      </p>
    </div>
  );
}
