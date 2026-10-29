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
  BatteryWarning,
} from "lucide-react";

import {
  APPLIANCE_PRESETS,
  type ApplianceId,
  type ProfilePresetId,
} from "@/lib/appliances";
import { calculateDailyKwh } from "@/lib/calculator";
import { SOLAR_CONFIG } from "@/lib/config";
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
import {
  translateApplianceName,
  translateCityName,
} from "@/lib/translations";
import { useLanguage } from "@/components/LanguageProvider";

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
  const { lang, t } = useLanguage();

  const [preset, setPreset] = React.useState<PresetSelection>("home");
  const [city, setCity] = React.useState<EthiopianCity>("Addis Ababa");
  const [outageHoursPerDay, setOutageHoursPerDay] = React.useState<number>(
    SOLAR_CONFIG.defaultOutageHoursPerDay
  );
  const [appliances, setAppliances] = React.useState<EditableApplianceItem[]>(
    () => getDefaultAppliancesForPreset("home")
  );
  const [isNavigating, setIsNavigating] = React.useState(false);

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
          outageHoursPerDay?: number;
          appliances?: EditableApplianceItem[];
        };
        if (parsed.city && ETHIOPIAN_CITIES.includes(parsed.city)) {
          setCity(parsed.city);
        }
        if (parsed.preset) {
          setPreset(parsed.preset);
        }
        if (typeof parsed.outageHoursPerDay === "number") {
          setOutageHoursPerDay(
            Math.min(
              SOLAR_CONFIG.maxOutageHoursPerDay,
              Math.max(0, parsed.outageHoursPerDay)
            )
          );
        }
        if (Array.isArray(parsed.appliances) && parsed.appliances.length > 0) {
          setAppliances(
            parsed.appliances.map((item) => ({
              ...item,
              essential:
                typeof item.essential === "boolean" ? item.essential : true,
            }))
          );
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
      nextOutageHours: number,
      nextAppliances: EditableApplianceItem[]
    ) => {
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            preset: nextPreset,
            city: nextCity,
            outageHoursPerDay: nextOutageHours,
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
                essential: true,
              },
            ];
      setAppliances(nextList);
      persistState("custom", city, outageHoursPerDay, nextList);
      return;
    }

    const presetItems = getDefaultAppliancesForPreset(
      nextPreset as ProfilePresetId
    );
    setAppliances(presetItems);
    persistState(nextPreset, city, outageHoursPerDay, presetItems);
  };

  const handleCityChange = (nextCity: EthiopianCity) => {
    setCity(nextCity);
    persistState(preset, nextCity, outageHoursPerDay, appliances);
  };

  const handleOutageHoursChange = (rawHours: number) => {
    const clamped = Math.min(
      SOLAR_CONFIG.maxOutageHoursPerDay,
      Math.max(0, Math.round(Number(rawHours) * 2) / 2 || 0)
    );
    setOutageHoursPerDay(clamped);
    persistState(preset, city, clamped, appliances);
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
      essential: found.essential,
    };

    const nextList = [...appliances, newItem];
    setAppliances(nextList);
    persistState(preset, city, outageHoursPerDay, nextList);
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
      essential: true,
    };

    const nextList = [...appliances, newItem];
    setAppliances(nextList);
    setCustomName("");
    setCustomWatts("100");
    setShowCustomForm(false);
    persistState("custom", city, outageHoursPerDay, nextList);
  };

  const handleRemoveAppliance = (id: string) => {
    const nextList = appliances.filter((item) => item.id !== id);
    setAppliances(nextList);
    persistState(preset, city, outageHoursPerDay, nextList);
  };

  const handleUpdateQuantity = (
    id: string,
    deltaOrValue: number,
    isDelta: boolean
  ) => {
    const nextList = appliances.map((item) => {
      if (item.id !== id) return item;
      const nextQty = isDelta
        ? Math.max(1, item.quantity + deltaOrValue)
        : Math.max(1, Math.round(deltaOrValue) || 1);
      return { ...item, quantity: nextQty };
    });
    setAppliances(nextList);
    persistState(preset, city, outageHoursPerDay, nextList);
  };

  const handleUpdateHours = (
    id: string,
    deltaOrValue: number,
    isDelta: boolean
  ) => {
    const nextList = appliances.map((item) => {
      if (item.id !== id) return item;
      const rawHours = isDelta ? item.hoursPerDay + deltaOrValue : deltaOrValue;
      const nextHours = Math.min(24, Math.max(0.5, Number(rawHours) || 0.5));
      return { ...item, hoursPerDay: nextHours };
    });
    setAppliances(nextList);
    persistState(preset, city, outageHoursPerDay, nextList);
  };

  const handleToggleEssential = (id: string, checked: boolean) => {
    const nextList = appliances.map((item) =>
      item.id === id ? { ...item, essential: checked } : item
    );
    setAppliances(nextList);
    persistState(preset, city, outageHoursPerDay, nextList);
  };

  const handleCalculate = () => {
    setIsNavigating(true);
    persistState(preset, city, outageHoursPerDay, appliances);
    const queryString = encodeCalculatorSearchParams({
      preset,
      city,
      outageHoursPerDay,
      appliances,
    });
    router.push(`/results?${queryString}&lang=${lang}`);
  };

  const dailyKwh = calculateDailyKwh(appliances);
  const citySunData = FALLBACK_SUN_HOURS[city];
  const localizedCityName = translateCityName(city, lang);

  return (
    <div className="flex flex-col gap-5 sm:gap-6 pb-28">
      {/* Hero section */}
      <section className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="bg-amber-100 text-amber-900 border-amber-200 text-xs"
          >
            {t.home.stepBadge}
          </Badge>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {t.home.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {t.home.subtitle}
        </p>
      </section>

      {/* Step 1: Choose a Preset */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            {t.home.step1Title}
          </CardTitle>
          <CardDescription>{t.home.step1Desc}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
            <button
              type="button"
              onClick={() => handleSelectPreset("home")}
              className={`flex flex-col items-start gap-1.5 rounded-xl border p-2.5 sm:p-3 text-left transition-all ${
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
              <div className="font-semibold text-xs sm:text-sm text-slate-900">
                {t.home.presets.home.name}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-2">
                {t.home.presets.home.shortDesc}
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset("small-shop")}
              className={`flex flex-col items-start gap-1.5 rounded-xl border p-2.5 sm:p-3 text-left transition-all ${
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
              <div className="font-semibold text-xs sm:text-sm text-slate-900">
                {t.home.presets["small-shop"].name}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-2">
                {t.home.presets["small-shop"].shortDesc}
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset("clinic")}
              className={`flex flex-col items-start gap-1.5 rounded-xl border p-2.5 sm:p-3 text-left transition-all ${
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
              <div className="font-semibold text-xs sm:text-sm text-slate-900">
                {t.home.presets.clinic.name}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-2">
                {t.home.presets.clinic.shortDesc}
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset("custom")}
              className={`flex flex-col items-start gap-1.5 rounded-xl border p-2.5 sm:p-3 text-left transition-all ${
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
              <div className="font-semibold text-xs sm:text-sm text-slate-900">
                {t.home.presets.custom.name}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-2">
                {t.home.presets.custom.shortDesc}
              </p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Pick a City */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base sm:text-lg">
                {t.home.step2Title}
              </CardTitle>
              <CardDescription>{t.home.step2Desc}</CardDescription>
            </div>
            <Badge
              variant="outline"
              className="gap-1 bg-amber-50/60 text-amber-900 border-amber-200"
            >
              <Sun className="size-3.5 text-amber-600" />
              {t.home.peakSunHoursBadge(citySunData.peakSunHours)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city-select">{t.home.cityLabel}</Label>
              <Select
                id="city-select"
                value={city}
                onChange={(e) =>
                  handleCityChange(e.target.value as EthiopianCity)
                }
              >
                {ETHIOPIAN_CITIES.map((cityName) => (
                  <option key={cityName} value={cityName}>
                    {t.home.cityOptionLabel(
                      translateCityName(cityName, lang),
                      FALLBACK_SUN_HOURS[cityName].peakSunHours
                    )}
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
                  {translateCityName(cityName, lang)}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Power cuts (backup mode) section */}
      <Card className="border-amber-200/80 bg-amber-50/30">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                <BatteryWarning className="size-4.5" />
              </span>
              <div>
                <CardTitle className="text-base sm:text-lg">
                  {t.home.powerCutsTitle}
                </CardTitle>
                <CardDescription>{t.home.powerCutsDesc}</CardDescription>
              </div>
            </div>
            <Badge
              variant={outageHoursPerDay > 0 ? "default" : "outline"}
              className={
                outageHoursPerDay > 0
                  ? "bg-amber-600 text-white"
                  : "bg-white text-slate-600"
              }
            >
              {outageHoursPerDay > 0
                ? t.home.outageActiveBadge(outageHoursPerDay)
                : t.home.outageOffBadge}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Label
                htmlFor="outage-hours-input"
                className="text-xs sm:text-sm font-medium text-slate-800"
              >
                {t.home.outageHoursLabel}
              </Label>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  aria-label={t.home.outageHoursLabel}
                  min={0}
                  max={SOLAR_CONFIG.maxOutageHoursPerDay}
                  step={1}
                  value={outageHoursPerDay}
                  onChange={(e) =>
                    handleOutageHoursChange(Number(e.target.value))
                  }
                  className="h-2 flex-1 sm:w-40 cursor-pointer accent-amber-600"
                />
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() =>
                      handleOutageHoursChange(outageHoursPerDay - 1)
                    }
                    disabled={outageHoursPerDay <= 0}
                    aria-label="Decrease outage hours"
                    className="bg-white"
                  >
                    <Minus className="size-3.5" />
                  </Button>
                  <Input
                    id="outage-hours-input"
                    type="number"
                    min={0}
                    max={SOLAR_CONFIG.maxOutageHoursPerDay}
                    step={1}
                    value={outageHoursPerDay}
                    onChange={(e) =>
                      handleOutageHoursChange(Number(e.target.value))
                    }
                    className="h-8 w-16 bg-white text-center px-1 font-semibold"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() =>
                      handleOutageHoursChange(outageHoursPerDay + 1)
                    }
                    disabled={
                      outageHoursPerDay >= SOLAR_CONFIG.maxOutageHoursPerDay
                    }
                    aria-label="Increase outage hours"
                    className="bg-white"
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-600">{t.home.outageHelperText}</p>
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Appliance Editor */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base sm:text-lg">
                {t.home.step3Title}
              </CardTitle>
              <CardDescription>{t.home.step3Desc}</CardDescription>
            </div>
            <Badge variant="secondary" className="font-mono text-xs">
              {t.home.itemsSummaryBadge(appliances.length, dailyKwh.toFixed(2))}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="gap-4">
          {/* Add preset or custom appliance bar */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1 flex flex-col gap-1.5">
                <Label htmlFor="preset-appliance-select">
                  {t.home.addCommonApplianceLabel}
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
                      {t.home.typicalWattsOption(
                        t.appliances[presetApp.id],
                        presetApp.watts
                      )}
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
                  {t.home.addApplianceBtn}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCustomForm((prev) => !prev)}
                  className="h-10 px-3"
                >
                  {showCustomForm
                    ? t.home.customBtnCancel
                    : t.home.customBtnOpen}
                </Button>
              </div>
            </div>

            {showCustomForm && (
              <form
                onSubmit={handleAddCustomAppliance}
                className="border-t border-slate-200 pt-3 flex flex-col gap-2.5 sm:flex-row sm:items-end"
              >
                <div className="flex-1 flex flex-col gap-1">
                  <Label htmlFor="custom-appliance-name">
                    {t.home.customNameLabel}
                  </Label>
                  <Input
                    id="custom-appliance-name"
                    placeholder={t.home.customNamePlaceholder}
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    required
                  />
                </div>
                <div className="w-full sm:w-32 flex flex-col gap-1">
                  <Label htmlFor="custom-appliance-watts">
                    {t.home.customWattsLabel}
                  </Label>
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
                  {t.home.saveCustomBtn}
                </Button>
              </form>
            )}
          </div>

          <Separator />

          {/* Appliance List */}
          {appliances.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 py-8 px-4 text-center">
              <p className="text-sm font-medium text-slate-700">
                {t.home.emptyListTitle}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {t.home.emptyListDesc}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {appliances.map((item) => {
                const itemDailyKwh =
                  (item.watts * item.quantity * item.hoursPerDay) / 1000;
                const displayName = translateApplianceName(item.name, lang);
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-white p-3 sm:p-3.5 shadow-2xs flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-sm text-slate-900">
                            {displayName}
                          </span>
                          <Badge variant="outline" className="text-[11px]">
                            {t.home.wattsEachBadge(item.watts)}
                          </Badge>
                          {item.essential && (
                            <Badge
                              variant="secondary"
                              className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px]"
                            >
                              {t.home.essentialBadge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {t.home.dailyEnergyLabel}{" "}
                          <span className="font-medium text-slate-700">
                            {itemDailyKwh.toFixed(2)} {t.home.perDayUnit}
                          </span>{" "}
                          ({Math.round(itemDailyKwh * 1000)} Wh)
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRemoveAppliance(item.id)}
                        aria-label={t.home.removeAriaLabel(displayName)}
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 pt-2 border-t border-slate-100">
                      {/* Quantity Control */}
                      <div className="flex items-center justify-between gap-2">
                        <Label
                          htmlFor={`qty-${item.id}`}
                          className="text-xs text-slate-600"
                        >
                          {t.home.quantityLabel}
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
                            aria-label={t.home.decreaseQtyAria(displayName)}
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
                            className="h-7 w-14 sm:w-16 text-center px-1 font-medium"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            onClick={() =>
                              handleUpdateQuantity(item.id, 1, true)
                            }
                            aria-label={t.home.increaseQtyAria(displayName)}
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
                          {t.home.hoursPerDayLabel}
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
                            aria-label={t.home.decreaseHrsAria(displayName)}
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
                            className="h-7 w-14 sm:w-16 text-center px-1 font-medium"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            onClick={() =>
                              handleUpdateHours(item.id, 0.5, true)
                            }
                            disabled={item.hoursPerDay >= 24}
                            aria-label={t.home.increaseHrsAria(displayName)}
                          >
                            <Plus className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Essential Checkbox */}
                    <div className="flex items-center pt-1.5 border-t border-slate-100">
                      <label
                        htmlFor={`essential-${item.id}`}
                        className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none"
                      >
                        <input
                          id={`essential-${item.id}`}
                          type="checkbox"
                          checked={item.essential}
                          onChange={(e) =>
                            handleToggleEssential(item.id, e.target.checked)
                          }
                          className="size-4 rounded border-slate-300 accent-amber-600 cursor-pointer"
                        />
                        <span>{t.home.essentialCheckboxLabel}</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sticky Mobile-First Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-xs p-2.5 sm:p-3 shadow-lg">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
              <Zap className="size-4" />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] sm:text-xs text-slate-500 truncate">
                {t.home.totalDailyLoadLabel(localizedCityName)}
              </div>
              <div className="text-sm sm:text-base font-bold text-slate-900">
                {dailyKwh.toFixed(2)} {t.home.perDayUnit}
              </div>
            </div>
          </div>

          <Button
            type="button"
            size="lg"
            disabled={appliances.length === 0 || dailyKwh <= 0 || isNavigating}
            onClick={handleCalculate}
            className="h-10 sm:h-11 bg-amber-600 hover:bg-amber-700 text-white px-3.5 sm:px-5 text-xs sm:text-sm font-semibold shadow-xs shrink-0"
          >
            {t.home.seeResultsBtn}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
