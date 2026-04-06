export function ErrorState({
  message,
  tone = "danger",
}: {
  message: string;
  tone?: "danger" | "warning";
}) {
  const palette =
    tone === "warning"
      ? "border-warning/25 bg-warning/10 text-secondary"
      : "border-danger/20 bg-danger/10 text-danger";

  return (
    <div role="alert" className={`rounded-[28px] border p-6 text-sm shadow-panel ${palette}`}>
      {message}
    </div>
  );
}
