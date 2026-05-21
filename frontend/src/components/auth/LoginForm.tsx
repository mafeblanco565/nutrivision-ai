"use client";
import { GoogleAuthButton } from "./GoogleAuthButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm() {
  return (
    <Card className="shadow-xl border border-white/10 bg-white/8 backdrop-blur-md text-white" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold text-white">Bienvenido de vuelta</CardTitle>
        <CardDescription className="text-white/60">Ingresa a tu cuenta para continuar</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <GoogleAuthButton label="Continuar con Google" />
        <p className="text-xs text-center text-white/40 mt-4">
          Al continuar aceptas nuestros{" "}
          <a href="#" className="underline hover:text-white/70">Términos de servicio</a>
          {" "}y{" "}
          <a href="#" className="underline hover:text-white/70">Política de privacidad</a>
        </p>
      </CardContent>
    </Card>
  );
}
