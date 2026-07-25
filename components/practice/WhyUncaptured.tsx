export function WhyUncaptured() {
  return (
    <div className="bg-surface rounded-2xl border border-border p-4 sm:p-5">
      <div className="font-heading font-bold text-[15px] mb-1">Why this billing usually goes uncaptured</div>
      <div className="text-[12.5px] text-muted leading-relaxed flex flex-col gap-2">
        <p>
          Only <strong>17.9%</strong> of Medicare discharges eligible for Transitional Care Management (TCM) actually
          had it billed in 2019 (ASPE/PTAC Final Report, June 2023) — the codes and rates have existed for years, but
          the 2-day-contact deadline and F2F-visit bookkeeping burden mean most practices never file the claim.
        </p>
        <p>
          CMS also requires the TCM 2-day contact and the RPM/RTM monthly management touch to be a{" "}
          <strong>live, synchronous</strong> contact made by a clinician — Noridian (CMS MAC) guidance explicitly
          excludes &ldquo;digital assistants such as chat bots, Siri, or Alexa.&rdquo; So the AI here does the daily
          check-in volume, but a human still has to make — and log — the billable contact. That log is what
          automatically generates the CPT codes, statuses and the submittable billing document on each patient&rsquo;s
          page: nothing here is billed until a clinician actually records that live touch.
        </p>
      </div>
    </div>
  );
}
