"use client";
import { useState, useCallback, useId } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Upload, X, Loader2, CheckCircle, Edit2, Trash2,
  AlertCircle, Plus, ChevronDown, Save,
} from "lucide-react";
import { format, parseISO, subDays, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { useAnalyzeOnly, useSaveMeal, useLookupFood } from "@/hooks/useMeals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MealType, AnalysisPreviewResponse } from "@/types";

interface FoodAnalyzerProps {
  onClose: () => void;
  onSaved?: () => void;
  initialDate?: string;
}

const MEAL_TYPE_OPTIONS: { value: MealType; label: string; emoji: string }[] = [
  { value: "breakfast", label: "Desayuno", emoji: "🌅" },
  { value: "lunch", label: "Almuerzo", emoji: "☀️" },
  { value: "dinner", label: "Cena", emoji: "🌙" },
  { value: "snack", label: "Snack", emoji: "🍎" },
];

// Draft food item with cached per-100g macros for proportional recalculation
type DraftItem = {
  _key: string;
  food_name: string;
  quantity_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  confidence: number;
  is_manual: boolean;
  // Per-100g baseline for proportional scaling
  _cal100: number;
  _pro100: number;
  _carb100: number;
  _fat100: number;
  _fib100: number;
};

function makeDraftItem(
  partial: Omit<DraftItem, "_key" | "_cal100" | "_pro100" | "_carb100" | "_fat100" | "_fib100">,
  key: string
): DraftItem {
  const q = partial.quantity_g || 100;
  return {
    ...partial,
    _key: key,
    _cal100: (partial.calories / q) * 100,
    _pro100: (partial.protein_g / q) * 100,
    _carb100: (partial.carbs_g / q) * 100,
    _fat100: (partial.fat_g / q) * 100,
    _fib100: (partial.fiber_g / q) * 100,
  };
}

function recalcItem(item: DraftItem, newQty: number): DraftItem {
  const f = newQty / 100;
  return {
    ...item,
    quantity_g: newQty,
    calories: Math.round(item._cal100 * f * 10) / 10,
    protein_g: Math.round(item._pro100 * f * 10) / 10,
    carbs_g: Math.round(item._carb100 * f * 10) / 10,
    fat_g: Math.round(item._fat100 * f * 10) / 10,
    fiber_g: Math.round(item._fib100 * f * 10) / 10,
  };
}

function sumMacros(items: DraftItem[]) {
  return items.reduce(
    (acc, i) => ({
      calories: acc.calories + i.calories,
      protein_g: acc.protein_g + i.protein_g,
      carbs_g: acc.carbs_g + i.carbs_g,
      fat_g: acc.fat_g + i.fat_g,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );
}

type Step = "upload" | "analyzing" | "review" | "saving" | "saved";

const localToday = () => format(new Date(), "yyyy-MM-dd");

export function FoodAnalyzer({ onClose, onSaved, initialDate }: FoodAnalyzerProps) {
  const uid = useId();
  const [step, setStep] = useState<Step>("upload");
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [eatenAt, setEatenAt] = useState<string>(initialDate ?? localToday());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);

  // Review step state
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editQty, setEditQty] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFood, setNewFood] = useState({
    food_name: "", quantity: "100", unit: "g", calories: "", protein_g: "", carbs_g: "", fat_g: "",
  });

  const analyzeOnly = useAnalyzeOnly();
  const saveMeal = useSaveMeal();
  const lookupFood = useLookupFood();

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
      const preview: AnalysisPreviewResponse = await analyzeOnly.mutateAsync(selectedFile);
      setRawResponse(preview.raw_response ?? null);
      setAiConfidence(preview.confidence);
      const items = preview.detected_foods.map((f, idx) =>
        makeDraftItem({ ...f, is_manual: false }, `${uid}-${idx}`)
      );
      setDraftItems(items);
      setStep("review");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; code?: string };
      const msg =
        axiosErr?.response?.data?.detail ||
        (axiosErr?.code === "ECONNABORTED"
          ? "El análisis tardó demasiado. Intenta con una imagen más pequeña."
          : "No se pudo analizar la imagen. Intenta de nuevo.");
      setErrorMsg(msg);
      setStep("upload");
    }
  };

  const handleSave = async () => {
    if (draftItems.length === 0) return;
    setStep("saving");
    try {
      await saveMeal.mutateAsync({
        meal_type: mealType,
        eaten_at: eatenAt,
        items: draftItems.map(({ food_name, quantity_g, calories, protein_g, carbs_g, fat_g, fiber_g, confidence, is_manual }) => ({
          food_name, quantity_g, calories, protein_g, carbs_g, fat_g, fiber_g, confidence, is_manual,
        })),
        ai_raw_response: rawResponse,
        ai_confidence: aiConfidence,
      });
      setStep("saved");
      onSaved?.();
    } catch {
      setErrorMsg("No se pudo guardar la comida. Intenta de nuevo.");
      setStep("review");
    }
  };

  // Inline editing helpers
  const startEdit = (item: DraftItem) => {
    setEditingKey(item._key);
    setEditName(item.food_name);
    setEditQty(String(item.quantity_g));
  };

  const commitEdit = (key: string) => {
    setDraftItems((prev) =>
      prev.map((item) => {
        if (item._key !== key) return item;
        const qtyNum = parseFloat(editQty);
        const updated = isNaN(qtyNum) || qtyNum <= 0 ? item : recalcItem(item, qtyNum);
        return { ...updated, food_name: editName || item.food_name };
      })
    );
    setEditingKey(null);
  };

  const removeItem = (key: string) => {
    setDraftItems((prev) => prev.filter((i) => i._key !== key));
  };

  const UNITS = ["g", "ml", "unidad", "taza", "porción"];

  const handleAddManual = () => {
    const qty = parseFloat(newFood.quantity) || 100;
    const cal = parseFloat(newFood.calories) || 0;
    const pro = parseFloat(newFood.protein_g) || 0;
    const carb = parseFloat(newFood.carbs_g) || 0;
    const fat = parseFloat(newFood.fat_g) || 0;

    if (!newFood.food_name.trim()) return;

    // Display name includes unit if not grams
    const displayName = newFood.unit === "g"
      ? newFood.food_name.trim()
      : `${newFood.food_name.trim()} (${qty}${newFood.unit})`;

    const item = makeDraftItem(
      { food_name: displayName, quantity_g: qty, calories: cal, protein_g: pro, carbs_g: carb, fat_g: fat, fiber_g: 0, confidence: 0, is_manual: true },
      `${uid}-manual-${Date.now()}`
    );
    setDraftItems((prev) => [...prev, item]);
    setNewFood({ food_name: "", quantity: "100", unit: "g", calories: "", protein_g: "", carbs_g: "", fat_g: "" });
    setShowAddForm(false);
  };

  const totals = sumMacros(draftItems);

  // Date navigation helpers
  const changeDate = (delta: number) => {
    const d = parseISO(eatenAt);
    setEatenAt(format(delta > 0 ? addDays(d, 1) : subDays(d, 1), "yyyy-MM-dd"));
  };

  const isToday = eatenAt === localToday();
  const dateLabel = isToday ? "Hoy" : format(parseISO(eatenAt), "dd MMM", { locale: es });

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-border">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Analizar comida con IA</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {step === "upload" && "Sube o toma una foto"}
            {step === "analyzing" && "Detectando alimentos..."}
            {step === "review" && `${draftItems.length} alimento${draftItems.length !== 1 ? "s" : ""} detectados · Revisa y edita`}
            {step === "saving" && "Guardando..."}
            {step === "saved" && "¡Comida guardada!"}
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
          {/* ── UPLOAD ── */}
          {step === "upload" && (
            <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
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
                  isDragActive ? "border-primary bg-primary/5"
                    : preview ? "border-brand-300 bg-brand-50 dark:bg-brand-900/10"
                    : "border-border hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <input {...getInputProps()} />
                {preview ? (
                  <div className="relative inline-block">
                    <Image src={preview} alt="Meal preview" width={200} height={200} className="rounded-xl object-cover max-h-48 mx-auto" />
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
                    <p className="text-xs text-muted-foreground mt-2">JPG, PNG, WebP · Máx. 10MB</p>
                  </>
                )}
              </div>

              {/* Meal type */}
              <div className="grid grid-cols-4 gap-2">
                {MEAL_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMealType(opt.value)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      mealType === opt.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="text-xl mb-1">{opt.emoji}</div>
                    <p className="text-xs font-medium">{opt.label}</p>
                  </button>
                ))}
              </div>

              {/* Date picker */}
              <div className="flex items-center gap-2">
                <button onClick={() => changeDate(-1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <ChevronDown size={16} className="rotate-90" />
                </button>
                <div className="flex-1 text-center">
                  <input
                    type="date"
                    value={eatenAt}
                    max={localToday()}
                    onChange={(e) => setEatenAt(e.target.value)}
                    className="w-full text-center text-sm font-medium bg-transparent border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <button onClick={() => changeDate(1)} disabled={isToday} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30">
                  <ChevronDown size={16} className="-rotate-90" />
                </button>
              </div>

              <Button onClick={handleAnalyze} disabled={!selectedFile} className="w-full gap-2" size="lg">
                <Camera size={18} />
                Analizar con IA
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white dark:bg-gray-900 px-2 text-muted-foreground">o</span>
                </div>
              </div>

              <button
                onClick={() => { setDraftItems([]); setShowAddForm(true); setStep("review"); }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-muted-foreground hover:text-foreground transition-all"
              >
                <Plus size={16} /> Agregar comida por nombre
              </button>
            </motion.div>
          )}

          {/* ── ANALYZING ── */}
          {step === "analyzing" && (
            <motion.div key="analyzing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-16 text-center space-y-4">
              <div className="w-20 h-20 rounded-full gradient-brand flex items-center justify-center mx-auto animate-pulse">
                <span className="text-4xl">🔍</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Analizando tu comida...</p>
                <p className="text-sm text-muted-foreground mt-1">La IA está detectando los alimentos</p>
              </div>
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
            </motion.div>
          )}

          {/* ── REVIEW ── */}
          {step === "review" && (
            <motion.div key="review" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              {errorMsg && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Macro summary */}
              <div className="grid grid-cols-4 gap-2 p-3 bg-brand-50 dark:bg-brand-900/20 rounded-2xl">
                <div className="text-center">
                  <p className="text-lg font-bold text-brand-700">{Math.round(totals.calories)}</p>
                  <p className="text-xs text-muted-foreground">kcal</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-600">{Math.round(totals.protein_g)}g</p>
                  <p className="text-xs text-muted-foreground">Prot</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-amber-600">{Math.round(totals.carbs_g)}g</p>
                  <p className="text-xs text-muted-foreground">Carbs</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-red-500">{Math.round(totals.fat_g)}g</p>
                  <p className="text-xs text-muted-foreground">Grasa</p>
                </div>
              </div>

              {/* Meal type + date row */}
              <div className="flex gap-2">
                <Select value={mealType} onValueChange={(v) => setMealType(v as MealType)}>
                  <SelectTrigger className="flex-1 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEAL_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.emoji} {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input
                  type="date"
                  value={eatenAt}
                  max={localToday()}
                  onChange={(e) => setEatenAt(e.target.value)}
                  className="flex-1 text-sm bg-transparent border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Food items list */}
              <div className="space-y-2">
                {draftItems.map((item) => (
                  <div key={item._key} className="rounded-xl border border-border p-3 space-y-2">
                    {editingKey === item._key ? (
                      // Editing mode
                      <div className="space-y-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Nombre del alimento"
                          className="text-sm"
                        />
                        <div className="flex gap-2 items-center">
                          <Input
                            type="number"
                            value={editQty}
                            onChange={(e) => setEditQty(e.target.value)}
                            placeholder="Gramos"
                            className="text-sm w-28"
                            min={1}
                          />
                          <span className="text-xs text-muted-foreground">g</span>
                          <div className="flex gap-2 ml-auto">
                            <Button size="sm" variant="outline" onClick={() => setEditingKey(null)}>Cancelar</Button>
                            <Button size="sm" onClick={() => commitEdit(item._key)}>OK</Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Display mode
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium truncate">{item.food_name}</p>
                            {item.is_manual && (
                              <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded-full shrink-0">manual</span>
                            )}
                          </div>
                          <div className="flex gap-2 mt-0.5 text-xs text-muted-foreground">
                            <span>{item.quantity_g}g</span>
                            <span className="text-brand-600 font-medium">{Math.round(item.calories)} kcal</span>
                            <span className="text-blue-500">{Math.round(item.protein_g)}g P</span>
                            <span className="text-amber-500">{Math.round(item.carbs_g)}g C</span>
                            <span className="text-red-500">{Math.round(item.fat_g)}g G</span>
                          </div>
                        </div>
                        <button onClick={() => startEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-muted-foreground hover:text-foreground">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => removeItem(item._key)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add manual food */}
              {showAddForm ? (
                <div className="rounded-xl border-2 border-dashed border-primary/40 p-4 space-y-3">
                  <p className="text-sm font-medium">Agregar alimento</p>

                  {/* Name row */}
                  <Input
                    placeholder="Nombre del alimento *"
                    value={newFood.food_name}
                    onChange={(e) => setNewFood((f) => ({ ...f, food_name: e.target.value }))}
                    className="text-sm"
                    autoFocus
                  />

                  {/* Quantity + unit row */}
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="100"
                      value={newFood.quantity}
                      onChange={(e) => setNewFood((f) => ({ ...f, quantity: e.target.value }))}
                      className="text-sm flex-1"
                      min={1}
                    />
                    <select
                      value={newFood.unit}
                      onChange={(e) => setNewFood((f) => ({ ...f, unit: e.target.value }))}
                      className="text-sm border border-border rounded-xl px-2 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>

                  {/* AI calculate button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 border-primary/40 text-primary hover:bg-primary/5"
                    disabled={!newFood.food_name.trim() || lookupFood.isPending}
                    onClick={async () => {
                      try {
                        const result = await lookupFood.mutateAsync({
                          foodName: newFood.food_name.trim(),
                          quantity: parseFloat(newFood.quantity) || 100,
                          unit: newFood.unit,
                        });
                        setNewFood((f) => ({
                          ...f,
                          calories: String(result.calories),
                          protein_g: String(result.protein_g),
                          carbs_g: String(result.carbs_g),
                          fat_g: String(result.fat_g),
                        }));
                      } catch {
                        // silently ignore — user can fill manually
                      }
                    }}
                  >
                    {lookupFood.isPending
                      ? <><Loader2 size={14} className="animate-spin" /> Calculando...</>
                      : <><Camera size={14} /> Calcular macros con IA</>
                    }
                  </Button>

                  {/* Macro preview (editable) — shown after AI fills them */}
                  {newFood.calories !== "" && (
                    <div className="grid grid-cols-4 gap-2 p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl text-center">
                      <div>
                        <p className="text-sm font-bold text-brand-700">{newFood.calories}</p>
                        <p className="text-[10px] text-muted-foreground">kcal</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-blue-600">{newFood.protein_g}g</p>
                        <p className="text-[10px] text-muted-foreground">Prot</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-amber-600">{newFood.carbs_g}g</p>
                        <p className="text-[10px] text-muted-foreground">Carbs</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-red-500">{newFood.fat_g}g</p>
                        <p className="text-[10px] text-muted-foreground">Grasa</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setShowAddForm(false); setNewFood({ food_name: "", quantity: "100", unit: "g", calories: "", protein_g: "", carbs_g: "", fat_g: "" }); }} className="flex-1">
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={handleAddManual} disabled={!newFood.food_name.trim()} className="flex-1">
                      <Plus size={14} className="mr-1" /> Agregar
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-muted-foreground hover:text-foreground transition-all"
                >
                  <Plus size={16} /> Agregar alimento manual
                </button>
              )}

              {/* Save / discard */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setStep("upload"); setDraftItems([]); setErrorMsg(null); }} className="flex-1">
                  Nueva foto
                </Button>
                <Button onClick={handleSave} disabled={draftItems.length === 0} className="flex-1 gap-2">
                  <Save size={16} /> Guardar comida
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── SAVING ── */}
          {step === "saving" && (
            <motion.div key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Guardando comida...</p>
            </motion.div>
          )}

          {/* ── SAVED ── */}
          {step === "saved" && (
            <motion.div key="saved" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-12 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <CheckCircle size={40} className="text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">¡Comida guardada!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {Math.round(totals.calories)} kcal registradas para {dateLabel}
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">Ver timeline</Button>
                <Button onClick={() => { setStep("upload"); setPreview(null); setSelectedFile(null); setDraftItems([]); setErrorMsg(null); }} variant="outline" className="flex-1">
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
