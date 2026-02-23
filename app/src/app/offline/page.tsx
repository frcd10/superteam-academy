export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="text-6xl">📡</div>
      <h1 className="text-2xl font-bold">You&apos;re offline</h1>
      <p className="text-muted-foreground max-w-md">
        Check your internet connection and try again. Your progress is saved
        locally and will sync when you&apos;re back online.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 rounded-lg bg-primary px-6 py-2 text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}
