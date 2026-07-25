export function Card({
  title,
  subtitle,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`bg-surface rounded-3xl border border-border p-5 sm:p-6 ${className ?? ""}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h2 className="font-heading font-bold text-[18px]">{title}</h2>}
          {subtitle && <p className="text-[13px] text-muted mt-1">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
