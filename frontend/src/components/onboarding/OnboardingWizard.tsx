"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { profileService } from "@/services/profile.service";
import { useAuthStore } from "@/stores/auth";
import type { ProfileCreate, GoalType, ActivityLevel, SexType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Personal", "Medidas", "Actividad", "Objetivo"] as const;

interface FormState {
  full_name: string;
  age: string;
  sex: SexType | "";
  height_cm: string;
  weight_kg: string;
  activity_level: ActivityLevel | "";
  goal_type: GoalType | "";
}

const GOAL_OPTIONS: { value: GoalType; label: string; description: string; emoji: string }[] = [
  { value: "lose_fat", label: "Perder grasa", description: "Déficit calórico controlado", emoji: "🔥" },
  { value: "maintain", label: "Mantener peso", description: "Equilibrio calórico", emoji: "⚖️" },
  { value: "gain_muscle", label: "Ganar músculo", description: "Superávit calórico controlado", emoji: "💪" },
];

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; description: string }[] = [
  { value: "sedentary", label: "Sedentario", description: "Trabajo de oficina, poco ejercicio" },
  { value: "lightly_active", label: "Ligeramente activo", description: "Ejercicio 1-3 días/semana" },
  { value: "moderately_active", label: "Moderadamente activo", description: "Ejercicio 3-5 días/semana" },
  { value: "very_active", label: "Muy activo", description: "Ejercicio intenso 6-7 días/semana" },
  { value: "extra_active", label: "Extra activo", description: "Atleta o trabajo físico intenso" },
];

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const { updateUser } = useAuthStore();

  const [form, setForm] = useState<FormState>({
    full_name: "",
    age: "",
    sex: "",
    height_cm: "",
    weight_kg: "",
    activity_level: "",
    goal_type: "",
  });

  const createProfile = useMutation({
    mutationFn: (data: ProfileCreate) => profileService.create(data),
    onSuccess: () => {
      updateUser({ has_profile: true });
      router.push("/dashboard");
    },
  });

  const update = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    if (!form.sex || !form.activity_level || !form.goal_type) return;
    createProfile.mutate({
      full_name: form.full_name,
      age: parseInt(form.age),
      sex: form.sex,
      height_cm: parseFloat(form.height_cm),
      weight_kg: parseFloat(form.weight_kg),
      activity_level: form.activity_level,
      goal_type: form.goal_type,
    });
  };

  const variants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <div className="w-full max-w-lg">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configura tu perfil</h1>
        <p className="text-muted-foreground mt-1">Paso {step + 1} de {STEPS.length}</p>
        <Progress value={((step + 1) / STEPS.length) * 100} className="mt-4 h-2" />
      </div>

      <Card className="shadow-xl border-0 dark:bg-gray-900/50">
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {step === 0 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-4">¿Cómo te llamas?</h2>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nombre completo</Label>
                        <Input
                          value={form.full_name}
                          onChange={(e) => update("full_name", e.target.value)}
                          placeholder="Tu nombre"
                          autoFocus
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Edad</Label>
                        <Input
                          type="number"
                          value={form.age}
                          onChange={(e) => update("age", e.target.value)}
                          placeholder="25"
                          min={10}
                          max={120}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Sexo biológico</Label>
                        <div className="grid grid-cols-3 gap-3">
                          {(["male", "female", "other"] as SexType[]).map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => update("sex", s)}
                              className={cn(
                                "py-3 rounded-xl border-2 text-sm font-medium transition-all",
                                form.sex === s
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border hover:border-primary/50"
                              )}
                            >
                              {s === "male" ? "Masculino" : s === "female" ? "Femenino" : "Otro"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold mb-4">Tus medidas</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Altura (cm)</Label>
                      <Input
                        type="number"
                        value={form.height_cm}
                        onChange={(e) => update("height_cm", e.target.value)}
                        placeholder="175"
                        min={50}
                        max={300}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Peso (kg)</Label>
                      <Input
                        type="number"
                        value={form.weight_kg}
                        onChange={(e) => update("weight_kg", e.target.value)}
                        placeholder="75"
                        step="0.1"
                        min={20}
                        max={500}
                      />
                    </div>
                  </div>
                  {form.height_cm && form.weight_kg && (
                    <div className="p-4 bg-brand-50 dark:bg-brand-900/20 rounded-xl">
                      <p className="text-sm text-brand-700 dark:text-brand-300 font-medium">
                        IMC: {(parseFloat(form.weight_kg) / Math.pow(parseFloat(form.height_cm) / 100, 2)).toFixed(1)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold mb-4">Nivel de actividad</h2>
                  {ACTIVITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => update("activity_level", opt.value)}
                      className={cn(
                        "w-full p-4 rounded-xl border-2 text-left transition-all",
                        form.activity_level === opt.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <p className="font-medium text-sm">{opt.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                    </button>
                  ))}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold mb-4">¿Cuál es tu objetivo?</h2>
                  {GOAL_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => update("goal_type", opt.value)}
                      className={cn(
                        "w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4",
                        form.goal_type === opt.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <span className="text-3xl">{opt.emoji}</span>
                      <div>
                        <p className="font-semibold">{opt.label}</p>
                        <p className="text-sm text-muted-foreground">{opt.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                <ChevronLeft size={16} className="mr-1" />
                Atrás
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button
                onClick={() => setStep(step + 1)}
                className="flex-1"
                disabled={
                  (step === 0 && (!form.full_name || !form.age || !form.sex)) ||
                  (step === 1 && (!form.height_cm || !form.weight_kg)) ||
                  (step === 2 && !form.activity_level)
                }
              >
                Siguiente
                <ChevronRight size={16} className="ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="flex-1"
                disabled={!form.goal_type || createProfile.isPending}
              >
                {createProfile.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Calculando...</>
                ) : (
                  "Empezar a trackear 🚀"
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
