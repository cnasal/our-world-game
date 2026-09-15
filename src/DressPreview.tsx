import { costumeFor } from "./content/costumes";
export function DressPreview({ id }: { id: string }) {
  const dress = costumeFor(id);
  if (!dress) return null;
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 64 64"
      role="img"
      aria-label={dress.name}
    >
      <path
        d="M22 8 L28 13 L36 13 L42 8 L48 18 L41 23 L43 31 L57 57 L7 57 L21 31 L23 23 L16 18 Z"
        fill={dress.fabric}
      />
      <path d="M21 31 H43 M12 53 H52" stroke={dress.trim} strokeWidth="3" />
      <path d="M32 31 L24 26 V36 Z M32 31 L40 26 V36 Z" fill={dress.trim} />
      {[22, 32, 42].map((x) => (
        <circle key={x} cx={x} cy="47" r="1.5" fill={dress.trim} />
      ))}
    </svg>
  );
}
