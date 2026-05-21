"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileService } from "@/services/profile.service";
import { useAuthStore } from "@/stores/auth";
import { useLogout } from "@/hooks/useAuth";
import { getGoalLabel, getActivityLabel } from "@/lib/utils";
import { User, Target, Activity, Flame, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SkeletonCard } from "@/components/common/SkeletonCard";

export function ProfileView() {
  const { user } = useAuthStore();
  const logout = useLogout();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: profileService.get,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard className="h-32" />
        <SkeletonCard className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi perfil</h1>

      {/* User card */}
      <Card className="border-0 shadow-sm dark:bg-gray-900">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center shadow-md">
              <User size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{profile?.full_name ?? "—"}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {user?.is_premium && <Badge className="mt-1">Premium</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {profile && (
        <>
          <Card className="border-0 shadow-sm dark:bg-gray-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Datos personales
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              {[
                { label: "Edad", value: `${profile.age} años` },
                { label: "Altura", value: `${profile.height_cm} cm` },
                { label: "Peso", value: `${profile.weight_kg} kg` },
              ].map(({ label, value }) => (
                <div key={label} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-lg font-bold">{value.split(" ")[0]}</p>
                  <p className="text-xs text-muted-foreground">{value.split(" ").slice(1).join(" ")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm dark:bg-gray-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Objetivos calculados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl">
                <div className="flex items-center gap-2">
                  <Flame size={16} className="text-brand-600" />
                  <span className="text-sm font-medium">Calorías objetivo</span>
                </div>
                <span className="font-bold text-brand-700">{Math.round(profile.target_calories ?? 0)} kcal</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <p className="text-sm font-bold text-blue-700">{Math.round(profile.target_protein_g ?? 0)}g</p>
                  <p className="text-xs text-muted-foreground">Proteína</p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                  <p className="text-sm font-bold text-amber-700">{Math.round(profile.target_carbs_g ?? 0)}g</p>
                  <p className="text-xs text-muted-foreground">Carbos</p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                  <p className="text-sm font-bold text-red-600">{Math.round(profile.target_fat_g ?? 0)}g</p>
                  <p className="text-xs text-muted-foreground">Grasa</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Objetivo</span>
                  <span className="font-medium">{getGoalLabel(profile.goal_type)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Actividad</span>
                  <span className="font-medium">{getActivityLabel(profile.activity_level)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">TMB</span>
                  <span className="font-medium">{Math.round(profile.bmr ?? 0)} kcal</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">TDEE</span>
                  <span className="font-medium">{Math.round(profile.tdee ?? 0)} kcal</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Button
        variant="destructive"
        className="w-full gap-2"
        onClick={logout}
      >
        <LogOut size={16} />
        Cerrar sesión
      </Button>
    </div>
  );
}
