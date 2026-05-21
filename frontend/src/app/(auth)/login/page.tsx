import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { AppleSvg } from "@/components/common/AppleSvg";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "#0E1207" }}
    >
      {/* Radial glow from brand design */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(70% 50% at 50% 30%, rgba(207,255,63,0.18) 0%, transparent 60%)",
        }}
      />

      {/* Logo splash */}
      <div className="relative z-10 flex flex-col items-center mb-10">
        <AppleSvg size={150} className="drop-shadow-2xl" />

        <div className="mt-6 flex items-baseline gap-2">
          <span className="font-sora text-5xl leading-none text-white">
            <span className="font-bold">Nutri</span>
            <span className="font-light">Vision</span>
          </span>
          <span className="font-sora font-semibold text-sm px-2.5 py-1 rounded-full bg-[#CFFF3F] text-[#1F3000] leading-none">
            AI
          </span>
        </div>

        <p className="mt-4 font-sora text-xs tracking-[0.3em] text-[#CFFF3F]/60 uppercase">
          SCAN · COUNT · CRUSH IT
        </p>
      </div>

      {/* Login form */}
      <div className="relative z-10 w-full max-w-md">
        <LoginForm />
      </div>
    </main>
  );
}
