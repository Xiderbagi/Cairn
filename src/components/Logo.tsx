export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" aria-hidden="true">
      <ellipse cx="15" cy="25" rx="12" ry="4" fill="var(--stone)" />
      <ellipse cx="15" cy="17.5" rx="9" ry="3.6" fill="var(--stone)" opacity=".85" />
      <ellipse cx="15" cy="10.5" rx="6.5" ry="3.2" fill="var(--accent)" />
      <ellipse cx="15" cy="4.6" rx="4" ry="2.4" fill="var(--accent)" opacity=".8" />
    </svg>
  );
}
