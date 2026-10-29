"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Home,
  Store,
  Stethoscope,
  SlidersHorizontal,
  MapPin,
  Plus,
  Trash2,
  Minus,
  Zap,
  ArrowRight,
  Sun,
} from "lucide-react";

import {
  APPLIANCE_PRESETS,
  PROFILE_PRESETS,
  type ApplianceId,
  type ProfilePresetId,
} from "@/lib/appliances";
import { calculateDailyKwh } from "@/lib/calculator";
import {
  ETHIOPIAN_CITIES,
  FALLBACK_SUN_HOURS,
  type EthiopianCity,
} from "@/lib/sunHours";
import {
  STORAGE_KEY,
  encodeCalculatorSearchParams,
  getDefaultAppliancesForPreset,
  type EditableApplianceItem,
  type PresetSelection,
} from "@/lib/urlState";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { Select, Separator } from "@/components/ui/select";

export default function HomePage() {
  const router = useRouter();

  const [preset, setPreset] = React.useState<PresetSelection>("home");
  const [city, setCity] = React.useState<EthiopianCity>("Addis Ababa");
  const [appliances, setAppliances] = React.useState<EditableApplianceItem[]>(
    () => getDefaultAppliancesForPreset("home")
  );

  // Add-appliance controls
  const [selectedApplianceId, setSelectedApplianceId] =
    React.useState<ApplianceId>("led-bulb");
  const [customName, setCustomName] = React.useState("");
  const [customWatts, setCustomWatts] = React.useState("100");
  const [showCustomForm, setShowCustomForm] = React.useState(false);

  // Restore saved state from sessionStorage if returning from /results
  React.useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as {
          preset?: PresetSelection;
          city?: EthiopianCity;
          appliances?: EditableApplianceItem[];
        };
        if (parsed.city && ETHIOPIAN_CITIES.includes(parsed.city)) {
          setCity(parsed.city);
        }
        if (parsed.preset) {
          setPreset(parsed.preset);
        }
        if (Array.isArray(parsed.appliances) && parsed.appliances.length > 0) {
          setAppliances(parsed.appliances);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Persist current changes to sessionStorage
  const persistState = React.useCallback(
    (
      nextPreset: PresetSelection,
      nextCity: EthiopianCity,
      nextAppliances: EditableApplianceItem[]
    ) => {
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            preset: nextPreset,
            city: nextCity,
            appliances: nextAppliances,
          })
        );
      } catch {
        // Ignore storage errors
      }
    },
    []
  );

  const handleSelectPreset = (nextPreset: PresetSelection) => {
    setPreset(nextPreset);
    if (nextPreset === "custom") {
      // Keep current list or start with 1 LED bulb if empty so user can edit freely
      const nextList =
        appliances.length > 0
          ? appliances
          : [
              {
                id: `custom-${Date.now()}`,
                name: "LED bulb",
                watts: 10,
                quantity: 4,
                hoursPerDay: 5,
              },
            ];
      setAppliances(nextList);
      persistState("custom", city, nextList);
      return;
    }

    const presetItems = getDefaultAppliancesForPreset(
      nextPreset as ProfilePresetId
    );
    setAppliances(presetItems);
    persistState(nextPreset, city, presetItems);
  };

  const handleCityChange = (nextCity: EthiopianCity) => {
    setCity(nextCity);
    persistState(preset, nextCity, appliances);
  };

  const handleAddPresetAppliance = () => {
    const found = APPLIANCE_PRESETS.find((a) => a.id === selectedApplianceId);
    if (!found) return;

    const newItem: EditableApplianceItem = {
      id: `${found.id}-${Date.now()}`,
      name: found.name,
      watts: found.watts,
      quantity: found.defaultQuantity,
      hoursPerDay: found.defaultHoursPerDay,
    };

    const nextList = [...appliances, newItem];
    setAppliances(nextList);
    persistState(preset, city, nextList);
  };

  const handleAddCustomAppliance = (e: React.FormEvent) => {
    e.preventDefault();
    const wattsNum = Math.max(1, Number(customWatts) || 50);
    const trimmedName = customName.trim() || "Custom appliance";

    const newItem: EditableApplianceItem = {
      id: `custom-${Date.now()}`,
      name: trimmedName,
      watts: wattsNum,
      quantity: 1,
      hoursPerDay: 4,
    };

    const nextList = [...appliances, newItem];
    setAppliances(nextList);
    setCustomName("");
    setCustomWatts("100");
    setShowCustomForm(false);
    persistState("custom", city, nextList);
  };

  const handleRemoveAppliance = (id: string) => {
    const nextList = appliances.filter((item) => item.id !== id);
    setAppliances(nextList);
    persistState(preset, city, nextList);
  };

  const handleUpdateQuantity = (id: string, deltaOrValue: number, isDelta: boolean) => {
    const nextList = appliances.map((item) => {
      if (item.id !== id) return item;
      const nextQty = isDelta
        ? Math.max(1, item.quantity + deltaOrValue)
        : Math.max(1, Math.round(deltaOrValue) || 1);
      return { ...item, quantity: nextQty };
    });
    setAppliances(nextList);
    persistState(preset, city, nextList);
  };

  const handleUpdateHours = (id: string, deltaOrValue: number, isDelta: boolean) => {
    const nextList = appliances.map((item) => {
      if (item.id !== id) return item;
      const rawHours = isDelta ? item.hoursPerDay + deltaOrValue : deltaOrValue;
      const nextHours = Math.min(24, Math.max(0.5, Number(rawHours) || 0.5));
      return { ...item, hoursPerDay: nextHours };
    });
    setAppliances(nextList);
    persistState(preset, city, nextList);
  };

  const handleCalculate = () => {
    persistState(preset, city, appliances);
    const queryString = encodeCalculatorSearchParams({
      preset,
      city,
      appliances,
    });
    router.push(`/results?${queryString}`);
  };

  const dailyKwh = calculateDailyKwh(appliances);
  const citySunData = FALLBACK_SUN_HOURS[city];

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Hero section */}
      <section className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="bg-amber-100 text-amber-900 border-amber-200"
          >
            Step 1 of 2 • Load & Location
          </Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Size your solar system in minutes
        </h1>
        <p className="text-sm text-slate-600">
          Choose a preset profile or build a custom appliance list, pick your
          city in Ethiopia, and get instant panel, battery, and ETB cost
          estimates.
        </p>
      </section>

      {/* Step 1: Choose a Preset */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            1. Choose a Starting Profile
          </CardTitle>
          <CardDescription>
            Start with a typical Ethiopian load profile or build a custom list
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => handleSelectPreset("home")}
              className={`flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-all ${
                preset === "home"
                  ? "border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <Home className="size-4 text-amber-600" />
                {preset === "home" && (
                  <span className="size-2 rounded-full bg-amber-500" />
                )}
              </div>
              <div className="font-semibold text-sm text-slate-900">
                {PROFILE_PRESETS.home.name}
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">
                Lights, phones, TV & fridge
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset("small-shop")}
              className={`flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-all ${
                preset === "small-shop"
                  ? "border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <Store className="size-4 text-amber-600" />
                {preset === "small-shop" && (
                  <span className="size-2 rounded-full bg-amber-500" />
                )}
              </div>
              <div className="font-semibold text-sm text-slate-900">
                {PROFILE_PRESETS["small-shop"].name}
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">
                Lights, fan & shop freezer
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset("clinic")}
              className={`flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-all ${
                preset === "clinic"
                  ? "border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <Stethoscope className="size-4 text-amber-600" />
                {preset === "clinic" && (
                  <span className="size-2 rounded-full bg-amber-500" />
                )}
              </div>
              <div className="font-semibold text-sm text-slate-900">
                {PROFILE_PRESETS.clinic.name}
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">
                Vaccine fridge, lights & laptop
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset("custom")}
              className={`flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-all ${
                preset === "custom"
                  ? "border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <SlidersHorizontal className="size-4 text-amber-600" />
                {preset === "custom" && (
                  <span className="size-2 rounded-full bg-amber-500" />
                )}
              </div>
              <div className="font-semibold text-sm text-slate-900">
                Custom List
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">
                Build your own appliance list
              </p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Pick a City */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base sm:text-lg">
                2. Select Your City
              </CardTitle>
              <CardDescription>
                Determines average daily peak sun hours for solar sizing
              </CardDescription>
            </div>
            <Badge variant="outline" className="gap-1 bg-amber-50/60 text-amber-900 border-amber-200">
              <Sun className="size-3.5 text-amber-600" />
              {citySunData.peakSunHours} peak sun hrs/day
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city-select">City / Region in Ethiopia</Label>
              <Select
                id="city-select"
                value={city}
                onChange={(e) =>
                  handleCityChange(e.target.value as EthiopianCity)
                }
              >
                {ETHIOPIAN_CITIES.map((cityName) => (
                  <option key={cityName} value={cityName}>
                    {cityName} ({FALLBACK_SUN_HOURS[cityName].peakSunHours} peak
                    sun hours/day)
                  </option>
                ))}
              </Select>
            </div>

            {/* Quick-select pills for mobile convenience */}
            <div className="flex flex-wrap gap-1.5">
              {ETHIOPIAN_CITIES.map((cityName) => (
                <button
                  key={cityName}
                  type="button"
                  onClick={() => handleCityChange(cityName)}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                    city === cityName
                      ? "border-amber-500 bg-amber-500 text-white"
                      : "border-slate-200 bg-slate-100/80 text-slate-700 hover:bg-slate-200/70"
                  }`}
                >
                  <MapPin className="size-3" />
                  {cityName}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Appliance Editor */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base sm:text-lg">
                3. Appliance Editor
              </CardTitle>
              <CardDescription>
                Add or remove appliances and adjust quantity and hours per day
              </CardDescription>
            </div>
            <Badge variant="secondary" className="font-mono text-xs">
              {appliances.length} {appliances.length === 1 ? "item" : "items"} •{" "}
              {dailyKwh.toFixed(2)} kWh/day
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="gap-4">
          {/* Add preset or custom appliance bar */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1 flex flex-col gap-1.5">
                <Label htmlFor="preset-appliance-select">
                  Add a common appliance
                </Label>
                <Select
                  id="preset-appliance-select"
                  value={selectedApplianceId}
                  onChange={(e) =>
                    setSelectedApplianceId(e.target.value as ApplianceId)
                  }
                >
                  {APPLIANCE_PRESETS.map((presetApp) => (
                    <option key={presetApp.id} value={presetApp.id}>
                      {presetApp.name} ({presetApp.watts}W typical)
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleAddPresetAppliance}
                  className="h-10 flex-1 sm:flex-none bg-amber-600 hover:bg-amber-700 text-white px-4"
                >
                  <Plus className="size-4" />
                  Add Appliance
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCustomForm((prev) => !prev)}
                  className="h-10 px-3"
                >
                  {showCustomForm ? "Cancel" : "+ Custom"}
                </Button>
              </div>
            </div>

            {showCustomForm && (
              <form
                onSubmit={handleAddCustomAppliance}
                className="border-t border-slate-200 pt-3 flex flex-col gap-2.5 sm:flex-row sm:items-end"
              >
                <div className="flex-1 flex flex-col gap-1">
                  <Label htmlFor="custom-appliance-name">Appliance Name</Label>
                  <Input
                    id="custom-appliance-name"
                    placeholder="e.g. Coffee grinder, Router"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    required
                  />
                </div>
                <div className="w-full sm:w-32 flex flex-col gap-1">
                  <Label htmlFor="custom-appliance-watts">Power (Watts)</Label>
                  <Input
                    id="custom-appliance-watts"
                    type="number"
                    min={1}
                    max={10000}
                    value={customWatts}
                    onChange={(e) => setCustomWatts(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="h-9 px-4">
                  Save Custom Item
                </Button>
              </form>
            )}
          </div>

          <Separator />

          {/* Appliance List */}
          {appliances.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center">
              <p className="text-sm font-medium text-slate-700">
                No appliances in your list yet
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Select an appliance above and tap &ldquo;Add Appliance&rdquo; or
                pick a preset profile.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {appliances.map((item) => {
                const itemDailyKwh =
                  (item.watts * item.quantity * item.hoursPerDay) / 1000;
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900">
                            {item.name}
                          </span>
                          <Badge variant="outline" className="text-[11px]">
                            {item.watts}W each
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Daily energy:{" "}
                          <span className="font-medium text-slate-700">
                            {itemDailyKwh.toFixed(2)} kWh/day
                          </span>{" "}
                          ({Math.round(itemDailyKwh * 1000)} Wh)
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRemoveAppliance(item.id)}
                        aria-label={`Remove ${item.name}`}
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1 border-t border-slate-100">
                      {/* Quantity Control */}
                      <div className="flex items-center justify-between gap-2">
                        <Label
                          htmlFor={`qty-${item.id}`}
                          className="text-xs text-slate-600"
                        >
                          Quantity
                        </Label>
                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            onClick={() =>
                              handleUpdateQuantity(item.id, -1, true)
                            }
                            disabled={item.quantity <= 1}
                            aria-label={`Decrease quantity for ${item.name}`}
                          >
                            <Minus className="size-3.5" />
                          </Button>
                          <Input
                            id={`qty-${item.id}`}
                            type="number"
                            min={1}
                            max={200}
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateQuantity(
                                item.id,
                                Number(e.target.value),
                                false
                              )
                            }
                            className="h-7 w-16 text-center px-1 font-medium"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            onClick={() =>
                              handleUpdateQuantity(item.id, 1, true)
                            }
                            aria-label={`Increase quantity for ${item.name}`}
                          >
                            <Plus className="size-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Hours per Day Control */}
                      <div className="flex items-center justify-between gap-2">
                        <Label
                          htmlFor={`hrs-${item.id}`}
                          className="text-xs text-slate-600"
                        >
                          Hours / day
                        </Label>
                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            onClick={() =>
                              handleUpdateHours(item.id, -0.5, true)
                            }
                            disabled={item.hoursPerDay <= 0.5}
                            aria-label={`Decrease hours for ${item.name}`}
                          >
                            <Minus className="size-3.5" />
                          </Button>
                          <Input
                            id={`hrs-${item.id}`}
                            type="number"
                            step="0.5"
                            min={0.5}
                            max={24}
                            value={item.hoursPerDay}
                            onChange={(e) =>
                              handleUpdateHours(
                                item.id,
                                Number(e.target.value),
                                false
                              )
                            }
                            className="h-7 w-16 text-center px-1 font-medium"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            onClick={() =>
                              handleUpdateHours(item.id, 0.5, true)
                            }
                            disabled={item.hoursPerDay >= 24}
                            aria-label={`Increase hours for ${item.name}`}
                          >
                            <Plus className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sticky Mobile-First Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-xs p-3 shadow-lg">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
              <Zap className="size-4.5" />
            </span>
            <div>
              <div className="text-xs text-slate-500">
                Total Daily Load • {city}
              </div>
              <div className="text-base font-bold text-slate-900">
                {dailyKwh.toFixed(2)} kWh/day
              </div>
            </div>
          </div>

          <Button
            type="button"
            size="lg"
            disabled={appliances.length === 0 || dailyKwh <= 0}
            onClick={handleCalculate}
            className="h-11 bg-amber-600 hover:bg-amber-700 text-white px-5 font-semibold shadow-xs"
          >
            See Solar Results
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
