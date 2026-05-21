import { AppleSvg } from "./AppleSvg";

interface NutriVisionLogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "dark" | "light";
}

const SIZES = {
  sm: { apple: 28, text: "text-lg", badge: "text-[10px] px-1.5 py-0.5" },
  md: { apple: 36, text: "text-2xl", badge: "text-xs px-2 py-0.5" },
  lg: { apple: 56, text: "text-4xl", badge: "text-sm px-2.5 py-1" },
};

export function NutriVisionLogo({ size = "md", variant = "dark" }: NutriVisionLogoProps) {
  const s = SIZES[size];
  const textColor = variant === "dark" ? "text-[#0E1207]" : "text-white";
  const textMuted = variant === "dark" ? "text-[#0E1207]/60" : "text-white/70";

  return (
    <div className="flex items-center gap-2.5">
      <AppleSvg size={s.apple} />
      <div className="flex items-baseline gap-1.5">
        <span className={`font-sora ${s.text} leading-none ${textColor}`}>
          <span className="font-bold">Nutri</span>
          <span className="font-light">Vision</span>
        </span>
        <span
          className={`font-sora font-semibold ${s.badge} rounded-full bg-[#CFFF3F] text-[#1F3000] leading-none`}
        >
          AI
        </span>
      </div>
    </div>
  );
}
