function Bar({ className = "" }: { className?: string }) {
  return <div className={`rounded-md bg-muted-bg animate-pulse ${className}`} />;
}

export default function PatientDetailLoading() {
  return (
    <div className="flex flex-col gap-4 sm:gap-5 min-w-0">
      <div className="surface rounded-2xl px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3 sm:gap-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-muted-bg animate-pulse shrink-0" />
        <div className="min-w-0 flex-1 flex flex-col gap-2">
          <Bar className="h-4 w-40" />
          <Bar className="h-3 w-64" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="surface rounded-2xl p-3.5 sm:p-4.5 flex flex-col gap-2.5">
            <Bar className="h-3 w-16" />
            <Bar className="h-6 w-12" />
          </div>
        ))}
      </div>

      <div className="surface rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
        <Bar className="h-4 w-56" />
        <Bar className="h-[140px] w-full" />
      </div>

      <div className="surface rounded-2xl p-4 sm:p-5 flex flex-col gap-2.5">
        <Bar className="h-4 w-40 mb-1" />
        {[0, 1, 2].map((i) => (
          <Bar key={i} className="h-9 w-full" />
        ))}
      </div>
    </div>
  );
}
