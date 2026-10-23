type PuterUsageLimitNoticeProps = {
  onRetry?: () => void;
};

export default function PuterUsageLimitNotice({
  onRetry,
}: PuterUsageLimitNoticeProps) {
  return (
    <div
      role="alert"
      className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      <p>
        Your Puter account has reached its usage limit. Some saved data and AI
        features may be temporarily unavailable.
      </p>

      <div className="mt-3 flex flex-wrap gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg border border-red-300 px-4 py-2 font-medium text-red-700 hover:bg-red-100"
          >
            Retry
          </button>
        )}

        <a
          href="https://puter.com/dashboard/#billing"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          Manage Puter Plan
        </a>
      </div>
    </div>
  );
}
