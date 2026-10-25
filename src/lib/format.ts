export function money(n: number, decimals = 0): string {
  const abs = Math.abs(n).toLocaleString("en-CA", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return `${n < 0 ? "−" : ""}$${abs}`;
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
