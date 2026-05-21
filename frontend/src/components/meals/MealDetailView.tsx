"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { ArrowLeft, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { mealService } from "@/services/meal.service";
import { MEAL_KEYS } from "@/hooks/useMeals";
import { getMealTypeLabel, getMealTypeEmoji, formatCalories } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import type { MealItem } from "@/types";

interface MealDetailViewProps {
  mealId: number;
}

export function MealDetailView({ mealId }: MealDetailViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editGrams, setEditGrams] = useState("");

  const { data: meal, isLoading } = useQuery({
    queryKey: MEAL_KEYS.detail(mealId),
    queryFn: () => mealService.getMeal(mealId),
  });

  const updateItem = useMutation({
    mutationFn: ({ itemId, quantity_g }: { itemId: number; quantity_g: number }) =>
      mealService.updateMealItem(mealId, itemId, { quantity_g }),
    onSuccess: (updated) => {
      queryClient.setQueryData(MEAL_KEYS.detail(mealId), updated);
      queryClient.invalidateQueries({ queryKey: MEAL_KEYS.todayMacros });
      queryClient.invalidateQueries({ queryKey: MEAL_KEYS.today });
      setEditingId(null);
    },
  });

  const deleteItem = useMutation({
    mutationFn: (itemId: number) => mealService.deleteMealItem(mealId, itemId),
    onSuccess: (updated) => {
      queryClient.setQueryData(MEAL_KEYS.detail(mealId), updated);
      queryClient.invalidateQueries({ queryKey: MEAL_KEYS.todayMacros });
      queryClient.invalidateQueries({ queryKey: MEAL_KEYS.today });
    },
  });

  const deleteMeal = useMutation({
    mutationFn: () => mealService.deleteMeal(mealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEAL_KEYS.today });
      queryClient.invalidateQueries({ queryKey: MEAL_KEYS.todayMacros });
      router.push("/meals");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-lg">
        <SkeletonCard className="h-12" />
        <SkeletonCard className="h-48" />
        <SkeletonCard className="h-64" />
      </div>
    );
  }

  if (!meal) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Comida no encontrada</p>
        <Button variant="ghost" onClick={() => router.back()} className="mt-4">
          Volver
        </Button>
      </div>
    );
  }

  const activeItems = meal.items.filter((item) => !item.deleted_at);

  return (
    <div className="space-y-6 max-w-lg animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {getMealTypeEmoji(meal.meal_type)} {getMealTypeLabel(meal.meal_type)}
          </h1>
          <p className="text-xs text-muted-foreground">{meal.eaten_at}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => deleteMeal.mutate()}
          disabled={deleteMeal.isPending}
          className="text-destructive hover:text-destructive hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          {deleteMeal.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
        </Button>
      </div>

      {/* Image */}
      {meal.image_url && (
        <div className="rounded-2xl overflow-hidden aspect-video relative bg-gray-100 dark:bg-gray-800">
          <Image src={meal.image_url} alt="Meal" fill className="object-cover" />
        </div>
      )}

      {/* Totals */}
      <div className="grid grid-cols-4 gap-2 p-4 bg-brand-50 dark:bg-brand-900/20 rounded-2xl">
        <div className="text-center">
          <p className="text-lg font-bold text-brand-700">{formatCalories(meal.total_calories)}</p>
          <p className="text-xs text-muted-foreground">kcal</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-blue-600">{Math.round(meal.total_protein_g)}g</p>
          <p className="text-xs text-muted-foreground">Prot</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-amber-600">{Math.round(meal.total_carbs_g)}g</p>
          <p className="text-xs text-muted-foreground">Carbs</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-red-500">{Math.round(meal.total_fat_g)}g</p>
          <p className="text-xs text-muted-foreground">Grasa</p>
        </div>
      </div>

      {/* Food items */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">
            Alimentos detectados ({activeItems.length})
          </h2>
        </div>

        <div className="divide-y divide-border">
          {activeItems.map((item) => (
            <FoodItemRow
              key={item.id}
              item={item}
              isEditing={editingId === item.id}
              editGrams={editGrams}
              onEditStart={() => {
                setEditingId(item.id);
                setEditGrams(String(item.quantity_g));
              }}
              onEditCancel={() => setEditingId(null)}
              onEditSave={() =>
                updateItem.mutate({ itemId: item.id, quantity_g: parseFloat(editGrams) })
              }
              onGramsChange={setEditGrams}
              onDelete={() => deleteItem.mutate(item.id)}
              isSaving={updateItem.isPending && editingId === item.id}
              isDeleting={deleteItem.isPending && deleteItem.variables === item.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface FoodItemRowProps {
  item: MealItem;
  isEditing: boolean;
  editGrams: string;
  onEditStart: () => void;
  onEditCancel: () => void;
  onEditSave: () => void;
  onGramsChange: (v: string) => void;
  onDelete: () => void;
  isSaving: boolean;
  isDeleting: boolean;
}

function FoodItemRow({
  item, isEditing, editGrams, onEditStart, onEditCancel, onEditSave,
  onGramsChange, onDelete, isSaving, isDeleting,
}: FoodItemRowProps) {
  return (
    <div className="px-5 py-4 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{item.food_name}</p>
          {item.was_edited && (
            <span className="text-[10px] text-muted-foreground border border-border rounded px-1">editado</span>
          )}
        </div>

        {isEditing ? (
          <div className="flex items-center gap-2 mt-1.5">
            <Input
              type="number"
              value={editGrams}
              onChange={(e) => onGramsChange(e.target.value)}
              className="h-7 w-24 text-xs"
              min={1}
              step={1}
              autoFocus
            />
            <span className="text-xs text-muted-foreground">g</span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mt-0.5">
            {item.quantity_g}g · {Math.round(item.calories)} kcal · {Math.round(item.protein_g)}g P
          </p>
        )}
      </div>

      {isEditing ? (
        <div className="flex items-center gap-1">
          <Button size="icon" className="h-7 w-7" onClick={onEditSave} disabled={isSaving}>
            {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEditCancel}>
            <X size={12} />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEditStart}>
            <Pencil size={13} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          </Button>
        </div>
      )}
    </div>
  );
}
