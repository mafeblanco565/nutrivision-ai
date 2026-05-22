"use client";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, X, Loader2, CheckCircle, Edit2, Trash2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useAnalyzeMeal, useUpdateMealItem } from "@/hooks/useMeals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MealType } from "@/types";

interface FoodAnalyzerProps {
  onClose: () => void;
}

const MEAL_TYPE_OPTIONS: { value: MealType; label: string; emoji: string }[] = [
  { value: "breakfast", label: "Desayuno", emoji: "🌅" },
  { value: "lunch", label: "Almuerzo", emoji: "☀️" },
  { value: "dinner", label: "Cena", emoji: "🌙" },
  { value: "snack", label: "Snack", emoji: "🍎" },
];

type Step = "upload" | "analyzing" | "result";

export function FoodAnalyzer({ onClose }: FoodAnalyzerProps) {
  const [step, setStep] = useState<Step>("upload");
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const analyze = useAnalyzeMeal();
  const updateItem = useUpdateMealItem();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setErrorMsg(null);
    setStep("analyzing");
    try {
      await analyze.mutateAsync({
        file: selectedFile,
        mealType,
        date: format(new Date(), "yyyy-MM-dd"),
      });
      setStep("result");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        (err as { code?: string })?.code === "ECONNABORTED"
          ? "El análisis tardó demasiado. Intenta con una imagen más pequeña."
          : "No se pudo analizar la imagen. Intenta de nuevo.";
      setErrorMsg(msg);
      setStep("upload");
    }
  };

  const result = analyze.data;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-border">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Analizar comida con IA</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {step === "upload" && "Sube o toma una foto"}
            {step === "analyzing" && "Detectando alimentos..."}
            {step === "result" && "Análisis completado"}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="p-5">
        <AnimatePresence mode="wait">
          {step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Error banner */}
              {errorMsg && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : preview
                    ? "border-brand-300 bg-brand-50 dark:bg-brand-900/10"
                    : "border-border hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <input {...getInputProps()} />
                {preview ? (
                  <div className="relative inline-block">
                    <Image
                      src={preview}
                      alt="Meal preview"
                      width={200}
                      height={200}
                      className="rounded-xl object-cover max-h-48 mx-auto"
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPreview(null); setSelectedFile(null); }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mx-auto mb-3">
                      <Upload size={24} className="text-brand-600" />
                    </div>
                    <p className="font-medium text-sm">Arrastra tu foto aquí</p>
                    <p className="text-xs text-muted-foreground mt-1">o haz clic para seleccionar</p>
                    <p className="text-xs text-muted-foreground mt-2">JPG, PNG, WebP • Máx. 10MB</p>
                  </>
                )}
              </div>

              {/* Meal type selector */}
              <div className="grid grid-cols-4 gap-2">
                {MEAL_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMealType(opt.value)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      mealType === opt.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="text-xl mb-1">{opt.emoji}</div>
                    <p className="text-xs font-medium">{opt.label}</p>
                  </button>
                ))}
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={!selectedFile}
                className="w-full gap-2"
                size="lg"
              >
                <Camera size={18} />
                Analizar con IA
              </Button>
            </motion.div>
          )}

          {step === "analyzing" && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-16 text-center space-y-4"
            >
              <div className="w-20 h-20 rounded-full gradient-brand flex items-center justify-center mx-auto animate-pulse">
                <span className="text-4xl">🔍</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Analizando tu comida...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  La IA está detectando los alimentos y calculando las calorías
                </p>
              </div>
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
            </motion.div>
          )}

          {step === "result" && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-brand-600">
                <CheckCircle size={18} />
                <span className="text-sm font-medium">
                  {result.detected_foods.length} alimentos detectados
                  {result.confidence > 0 && ` · ${Math.round(result.confidence * 100)}% confianza`}
                </span>
              </div>

              {/* Totals */}
              <div className="grid grid-cols-4 gap-2 p-4 bg-brand-50 dark:bg-brand-900/20 rounded-2xl">
                <div className="text-center">
                  <p className="text-lg font-bold text-brand-700">{Math.round(result.total_calories)}</p>
                  <p className="text-xs text-muted-foreground">kcal</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-600">{Math.round(result.total_protein_g)}g</p>
                  <p className="text-xs text-muted-foreground">Prot</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-amber-600">{Math.round(result.total_carbs_g)}g</p>
                  <p className="text-xs text-muted-foreground">Carbs</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-red-500">{Math.round(result.total_fat_g)}g</p>
                  <p className="text-xs text-muted-foreground">Grasa</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Ver en timeline
                </Button>
                <Button onClick={() => { setStep("upload"); setPreview(null); setSelectedFile(null); }} variant="outline">
                  Nueva foto
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
