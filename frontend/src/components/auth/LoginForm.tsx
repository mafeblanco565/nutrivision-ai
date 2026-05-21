"use client";
import { GoogleAuthButton } from "./GoogleAuthButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm() {
  return (
    <Card className="shadow-xl border-0 dark:bg-gray-900/50 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Bienvenido de vuelta</CardTitle>
        <CardDescription>Ingresa a tu cuenta para continuar</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <GoogleAuthButton label="Continuar con Google" />
        <p className="text-xs text-center text-muted-foreground mt-4">
          Al continuar aceptas nuestros{" "}
          <a href="#" className="underline hover:text-foreground">Términos de servicio</a>
          {" "}y{" "}
          <a href="#" className="underline hover:text-foreground">Política de privacidad</a>
        </p>
      </CardContent>
    </Card>
  );
}
