export function NotificationBellFallback() {
  return (
    <div className="relative rounded-full p-2" aria-hidden>
      <div className="size-5 animate-pulse rounded bg-neutral-200" />
    </div>
  );
}
