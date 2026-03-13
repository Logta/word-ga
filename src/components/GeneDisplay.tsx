import { decode } from "../ga/core";

interface GeneDisplayProps {
  ind: string;
  target: string;
}

export function GeneDisplay({ ind, target }: GeneDisplayProps) {
  const decoded = decode(ind);
  return (
    <>
      {decoded.split("").map((ch, i) => (
        <span
          key={i}
          className={ch === target[i] ? "text-green-400 font-bold" : "text-red-400"}
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </>
  );
}
