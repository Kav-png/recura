import { submitAccessCode } from "@/lib/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm bg-surface border border-border rounded-2xl p-8">
        <div className="w-11 h-11 rounded-[11px] bg-primary flex items-center justify-center font-heading font-extrabold text-white text-lg mb-5">
          DS
        </div>
        <div className="font-heading font-extrabold text-xl mb-1">Discharge Safety Net</div>
        <div className="text-sm text-muted mb-6">Enter the practice access code to continue.</div>

        <form action={submitAccessCode} className="flex flex-col gap-3">
          <input type="hidden" name="next" value={next ?? "/doctor"} />
          <div>
            <div className="text-xs font-semibold text-muted mb-1.5">Access code</div>
            <input
              name="code"
              type="password"
              autoFocus
              required
              className="w-full px-3.5 py-2.5 rounded-[10px] border border-border text-[13.5px] focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
              placeholder="Enter code"
            />
          </div>
          {error && <div className="text-[12.5px] text-critical">That code isn&apos;t right. Try again.</div>}
          <button
            type="submit"
            className="mt-2 px-4 py-2.5 rounded-[10px] bg-primary text-white text-[13.5px] font-semibold hover:opacity-90 transition-opacity"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
