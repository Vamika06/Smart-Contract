export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white dark:bg-surface-950 flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-surface-200 dark:border-surface-700" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-500 animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-surface-900 dark:text-surface-100">SmartAudit</p>
          <p className="text-sm text-surface-500 dark:text-surface-400">Loading...</p>
        </div>
      </div>
    </div>
  );
}
