"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Sun,
  BatteryCharging,
  Zap,
  Banknote,
  TrendingUp,
  Clock,
  Info,
  SlidersHorizontal,
  RotateCcw,
  MessageSquareQuote,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

import {
  SOLAR_CONFIG,
  ASSUMPTION_DETAILS,
  type SolarConfig,
} from "@/lib/config";
import { calculateSolarSystem } from "@/lib/calculator";
import {
  ETHIOPIAN_CITIES,
  FALLBACK_SUN_HOURS,
  type EthiopianCity,
} from "@/lib/sunHours";
import {
  STORAGE_KEY,
  decodeCalculatorSearchParams,
  type CalculatorSessionState,
} from "@/lib/urlState";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { validateQuoteForm } from "@/lib/quoteValidation";
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
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Input,
  Label,
} from "@/components/ui/input";
import { Select, Separator } from "@/components/ui/select";

function formatEtb(amount: number): string {
  return new Intl.NumberFormat("en-ET", {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const { lang, t } = useLanguage();

  const [sessionState, setSessionState] =
    React.useState<CalculatorSessionState>(() =>
      decodeCalculatorSearchParams(searchParams)
    );

  // Editable assumptions state initialized from SOLAR_CONFIG (/lib/config.ts)
  const [config, setConfig] = React.useState<SolarConfig>(SOLAR_CONFIG);
  const [showAssumptionsEditor, setShowAssumptionsEditor] =
    React.useState(false);

  // Quote form state
  const [showQuoteForm, setShowQuoteForm] = React.useState(false);
  const [quoteName, setQuoteName] = React.useState("");
  const [quotePhone, setQuotePhone] = React.useState("");
  const [quoteCity, setQuoteCity] = React.useState<EthiopianCity>(
    sessionState.city
  );
  const [fieldErrors, setFieldErrors] = React.useState<{
    name?: string;
    phone?: string;
    city?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submittedQuote, setSubmittedQuote] = React.useState<{
    name: string;
    phone: string;
    city: EthiopianCity;
    panelKw: number;
    batteryKwh: number;
    costLow: number;
    costHigh: number;
  } | null>(null);

  // Sync session state & prefill quoteCity when searchParams or sessionStorage updates
  React.useEffect(() => {
    if (!searchParams.get("items") && !searchParams.get("city")) {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as CalculatorSessionState;
          if (parsed && Array.isArray(parsed.appliances) && parsed.city) {
            setSessionState(parsed);
            setQuoteCity(parsed.city);
            return;
          }
        }
      } catch {
        // Ignore storage errors
      }
    }
    const decoded = decodeCalculatorSearchParams(searchParams);
    setSessionState(decoded);
    setQuoteCity(decoded.city);
  }, [searchParams]);

  const cityData =
    FALLBACK_SUN_HOURS[sessionState.city] ?? FALLBACK_SUN_HOURS["Addis Ababa"];
  const localizedCityName = translateCityName(cityData.city, lang);

  const results = calculateSolarSystem({
    appliances: sessionState.appliances,
    peakSunHours: cityData.peakSunHours,
    config,
  });

  const handleResetAssumptions = () => {
    setConfig(SOLAR_CONFIG);
  };

  const handleOpenQuoteForm = () => {
    setQuoteCity(cityData.city);
    setFieldErrors({});
    setSubmitError(null);
    setSubmittedQuote(null);
    setShowQuoteForm(true);
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const validation = validateQuoteForm(
      {
        name: quoteName,
        phone: quotePhone,
        city: quoteCity,
      },
      lang
    );

    if (!validation.valid) {
      setFieldErrors(validation.errors);
      return;
    }

    setFieldErrors({});

    if (!isSupabaseConfigured()) {
      setSubmitError(t.results.supabaseUnconfiguredError);
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      setSubmitError(t.results.supabaseInitError);
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await client.from("quote_requests").insert({
        name: validation.sanitized.name,
        phone: validation.sanitized.phone,
        city: validation.sanitized.city,
        daily_kwh: results.dailyKwh,
        panel_kw: results.recommendedPanelKw,
        battery_kwh: results.batteryKwh,
        estimated_cost_low: results.costRange.low,
        estimated_cost_high: results.costRange.high,
      });

      if (error) {
        throw new Error(error.message);
      }

      setSubmittedQuote({
        name: validation.sanitized.name,
        phone: validation.sanitized.phone,
        city: quoteCity,
        panelKw: results.recommendedPanelKw,
        batteryKwh: results.batteryKwh,
        costLow: results.costRange.low,
        costHigh: results.costRange.high,
      });
      setQuoteName("");
      setQuotePhone("");
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : t.results.genericSubmitError;
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 sm:gap-6 pb-12">
      {/* Top navigation & summary header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href={`/?lang=${lang}`}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" />
          {t.results.backToEditor}
        </Link>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="gap-1 bg-amber-50 text-amber-900 border-amber-200 text-xs"
          >
            <MapPin className="size-3.5 text-amber-600" />
            {t.results.peakSunHoursBadge(
              localizedCityName,
              cityData.peakSunHours
            )}
          </Badge>
        </div>
      </div>

      <section className="flex flex-col gap-1.5">
        <Badge
          variant="secondary"
          className="bg-emerald-100 text-emerald-900 border-emerald-200 text-xs"
        >
          {t.results.stepBadge}
        </Badge>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {t.results.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          {t.results.subtitle(
            sessionState.appliances.length,
            localizedCityName
          )}
        </p>
      </section>

      {/* Primary Sizing Metrics Grid: Daily kWh, Recommended Panel kW, Battery kWh */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                {t.results.dailyEnergyCardTitle}
              </span>
              <Zap className="size-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {results.dailyKwh.toFixed(2)}{" "}
              <span className="text-sm sm:text-base font-medium text-slate-500">
                {t.results.kwhPerDayUnit}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {t.results.whAndMonthlySummary(
                Math.round(results.dailyKwh * 1000),
                (results.dailyKwh * config.daysPerMonth).toFixed(1)
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200/80 bg-amber-50/40">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-amber-900/80">
                {t.results.panelCardTitle}
              </span>
              <Sun className="size-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {results.recommendedPanelKw.toFixed(2)}{" "}
              <span className="text-sm sm:text-base font-medium text-slate-600">
                kW
              </span>
            </div>
            <p className="text-xs text-slate-600">
              {t.results.panelLossAllowanceNote(
                Math.round(config.systemLosses * 100),
                cityData.peakSunHours
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/80 bg-emerald-50/40">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-emerald-900/80">
                {t.results.batteryCardTitle}
              </span>
              <BatteryCharging className="size-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {results.batteryKwh.toFixed(2)}{" "}
              <span className="text-sm sm:text-base font-medium text-slate-600">
                kWh
              </span>
            </div>
            <p className="text-xs text-slate-600">
              {t.results.batteryAutonomyNote(
                config.batteryAutonomyDays,
                Math.round(config.batteryDepthOfDischarge * 100)
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Estimated Cost Range in ETB */}
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Banknote className="size-4.5" />
              </span>
              <div>
                <CardTitle className="text-base sm:text-lg">
                  {t.results.costRangeCardTitle}
                </CardTitle>
                <CardDescription>
                  {t.results.costRangeCardDesc(
                    Math.round(config.installationOverheadPct * 100)
                  )}
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {t.results.estimateBadge}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="gap-4">
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3.5 sm:p-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-amber-900/70">
                {t.results.installedCostRangeLabel}
              </span>
              <div className="text-xl font-extrabold text-slate-900 sm:text-3xl mt-0.5">
                {formatEtb(results.costRange.low)} –{" "}
                {formatEtb(results.costRange.high)}{" "}
                <span className="text-sm sm:text-base font-semibold text-slate-600">
                  ETB
                </span>
              </div>
            </div>
            <div className="text-xs text-slate-600">
              {t.results.midpointEstimateLabel}{" "}
              <span className="font-semibold text-slate-900">
                {formatEtb(results.costRange.midpoint)} ETB
              </span>
            </div>
          </div>

          {/* Monthly Savings & Payback Time */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  {t.results.vsGeneratorTitle}
                </span>
                <TrendingUp className="size-4 text-emerald-600 shrink-0" />
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs text-slate-500">
                  {t.results.monthlySavingsLabel}
                </span>
                <span className="text-sm sm:text-base font-bold text-emerald-700">
                  {formatEtb(results.monthlySavingsVsGenerator)}{" "}
                  {t.results.etbPerMonthUnit}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2 border-t border-slate-100 pt-2">
                <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                  <Clock className="size-3 shrink-0" />{" "}
                  {t.results.paybackTimeLabel}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-900 text-right">
                  {t.results.monthsAndYearsValue(
                    results.paybackMonths.vsGenerator,
                    (results.paybackMonths.vsGenerator / 12).toFixed(1)
                  )}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  {t.results.vsGridTitle}
                </span>
                <TrendingUp className="size-4 text-blue-600 shrink-0" />
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs text-slate-500">
                  {t.results.monthlySavingsLabel}
                </span>
                <span className="text-sm sm:text-base font-bold text-blue-700">
                  {formatEtb(results.monthlySavingsVsGrid)}{" "}
                  {t.results.etbPerMonthUnit}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-2 border-t border-slate-100 pt-2">
                <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                  <Clock className="size-3 shrink-0" />{" "}
                  {t.results.paybackTimeLabel}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-900 text-right">
                  {t.results.monthsAndYearsValue(
                    results.paybackMonths.vsGrid,
                    (results.paybackMonths.vsGrid / 12).toFixed(1)
                  )}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clear Note on Editable Assumptions */}
      <Alert className="border-amber-300/80 bg-amber-50/70">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-2.5">
            <Info className="size-4.5 text-amber-700 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <AlertTitle className="text-amber-950">
                {t.results.assumptionsAlertTitle}
              </AlertTitle>
              <AlertDescription className="text-amber-900/90">
                {t.results.assumptionsAlertBody({
                  overheadPct: Math.round(
                    config.installationOverheadPct * 100
                  ),
                  lossesPct: Math.round(config.systemLosses * 100),
                  dodPct: Math.round(config.batteryDepthOfDischarge * 100),
                  gridTariff: config.gridTariffPerKwhEtb,
                  genCost: config.generatorFuelCostPerKwhEtb,
                })}
              </AlertDescription>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAssumptionsEditor((prev) => !prev)}
            className="shrink-0 self-start border-amber-300 bg-white text-amber-950 hover:bg-amber-100/60"
          >
            <SlidersHorizontal className="size-3.5" />
            {showAssumptionsEditor
              ? t.results.hideAssumptionsBtn
              : t.results.editAssumptionsBtn}
          </Button>
        </div>

        {showAssumptionsEditor && (
          <div className="mt-3 border-t border-amber-200/80 pt-3 flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor="cfg-panel-cost" className="text-amber-950">
                  {t.results.assumptionFields.panelCost}
                </Label>
                <Input
                  id="cfg-panel-cost"
                  type="number"
                  min={1000}
                  step={1000}
                  value={config.panelCostPerKwEtb}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      panelCostPerKwEtb: Math.max(
                        0,
                        Number(e.target.value) || 0
                      ),
                    }))
                  }
                  className="bg-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="cfg-battery-cost" className="text-amber-950">
                  {t.results.assumptionFields.batteryCost}
                </Label>
                <Input
                  id="cfg-battery-cost"
                  type="number"
                  min={1000}
                  step={1000}
                  value={config.batteryCostPerKwhEtb}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      batteryCostPerKwhEtb: Math.max(
                        0,
                        Number(e.target.value) || 0
                      ),
                    }))
                  }
                  className="bg-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="cfg-overhead" className="text-amber-950">
                  {t.results.assumptionFields.installOverhead}
                </Label>
                <Input
                  id="cfg-overhead"
                  type="number"
                  min={0}
                  max={100}
                  value={Math.round(config.installationOverheadPct * 100)}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      installationOverheadPct:
                        Math.max(0, Number(e.target.value) || 0) / 100,
                    }))
                  }
                  className="bg-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="cfg-grid-tariff" className="text-amber-950">
                  {t.results.assumptionFields.gridTariff}
                </Label>
                <Input
                  id="cfg-grid-tariff"
                  type="number"
                  min={0.1}
                  step={0.5}
                  value={config.gridTariffPerKwhEtb}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      gridTariffPerKwhEtb: Math.max(
                        0.1,
                        Number(e.target.value) || 0.1
                      ),
                    }))
                  }
                  className="bg-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="cfg-gen-cost" className="text-amber-950">
                  {t.results.assumptionFields.generatorFuel}
                </Label>
                <Input
                  id="cfg-gen-cost"
                  type="number"
                  min={1}
                  step={1}
                  value={config.generatorFuelCostPerKwhEtb}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      generatorFuelCostPerKwhEtb: Math.max(
                        1,
                        Number(e.target.value) || 1
                      ),
                    }))
                  }
                  className="bg-white"
                />
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetAssumptions}
                  className="h-9 w-full bg-white text-slate-700"
                >
                  <RotateCcw className="size-3.5" />
                  {t.results.assumptionFields.resetBtn}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-amber-900/80 sm:grid-cols-4">
              {ASSUMPTION_DETAILS.map((item) => (
                <div
                  key={item.key}
                  className="rounded-lg border border-amber-200/60 bg-white/70 px-2.5 py-1.5"
                >
                  <div className="font-medium text-amber-950">
                    {t.results.assumptionMetaLabels[item.key] ?? item.label}
                  </div>
                  <div>
                    {t.results.assumptionFields.defaultLabel} {item.value}{" "}
                    {item.unit}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Alert>

      {/* Prominent "Get quotes" CTA & Quote Request Form */}
      <Card className="border-amber-400 bg-gradient-to-br from-amber-500/10 via-white to-amber-50">
        <CardContent className="flex flex-col gap-4 py-2">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {t.results.quoteCtaTitle(localizedCityName)}
                </h2>
                <Badge
                  variant="secondary"
                  className="bg-amber-100 text-amber-900 text-[11px]"
                >
                  {t.results.quoteCtaBadge}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-600">
                {t.results.quoteCtaDesc(
                  results.recommendedPanelKw.toFixed(2),
                  results.batteryKwh.toFixed(2)
                )}
              </p>
            </div>

            {!showQuoteForm && (
              <Button
                type="button"
                size="lg"
                onClick={handleOpenQuoteForm}
                className="h-12 w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white px-6 text-sm sm:text-base font-bold shadow-sm shrink-0"
              >
                <MessageSquareQuote className="size-5" />
                {t.results.getQuotesBtn}
              </Button>
            )}
          </div>

          {/* Quote Request Form or Confirmation Screen */}
          {showQuoteForm && (
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs">
              {submittedQuote ? (
                <div
                  role="status"
                  className="flex flex-col items-center text-center gap-3 py-4"
                >
                  <span className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="size-7" />
                  </span>
                  <div className="flex flex-col gap-1 max-w-md">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {t.results.confirmTitle}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {t.results.confirmMessage({
                        name: submittedQuote.name,
                        panelKw: submittedQuote.panelKw.toFixed(2),
                        batteryKwh: submittedQuote.batteryKwh.toFixed(2),
                        cityLabel: translateCityName(submittedQuote.city, lang),
                        costLow: formatEtb(submittedQuote.costLow),
                        costHigh: formatEtb(submittedQuote.costHigh),
                        phone: submittedQuote.phone,
                      })}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSubmittedQuote(null);
                        setShowQuoteForm(false);
                      }}
                    >
                      {t.results.doneBtn}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setSubmittedQuote(null)}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {t.results.submitAnotherBtn}
                    </Button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleQuoteSubmit}
                  noValidate
                  className="flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base text-slate-900">
                        {t.results.quoteFormTitle}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {t.results.quoteFormDesc(
                          results.recommendedPanelKw.toFixed(2),
                          results.batteryKwh.toFixed(2)
                        )}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setShowQuoteForm(false)}
                      aria-label={t.results.closeQuoteFormAria}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>

                  {submitError && (
                    <Alert className="border-red-200 bg-red-50 text-red-900">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="size-4 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <AlertTitle className="text-red-900 text-xs font-semibold">
                            {t.results.submitErrorTitle}
                          </AlertTitle>
                          <AlertDescription className="text-red-800 text-xs">
                            {submitError}
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="quote-name">
                        {t.results.fullNameLabel}
                      </Label>
                      <Input
                        id="quote-name"
                        placeholder={t.results.fullNamePlaceholder}
                        value={quoteName}
                        onChange={(e) => {
                          setQuoteName(e.target.value);
                          if (fieldErrors.name) {
                            setFieldErrors((prev) => ({
                              ...prev,
                              name: undefined,
                            }));
                          }
                        }}
                        aria-invalid={Boolean(fieldErrors.name)}
                      />
                      {fieldErrors.name && (
                        <p className="text-xs text-red-600">
                          {fieldErrors.name}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="quote-phone">
                        {t.results.phoneLabel}
                      </Label>
                      <Input
                        id="quote-phone"
                        type="tel"
                        placeholder={t.results.phonePlaceholder}
                        value={quotePhone}
                        onChange={(e) => {
                          setQuotePhone(e.target.value);
                          if (fieldErrors.phone) {
                            setFieldErrors((prev) => ({
                              ...prev,
                              phone: undefined,
                            }));
                          }
                        }}
                        aria-invalid={Boolean(fieldErrors.phone)}
                      />
                      {fieldErrors.phone && (
                        <p className="text-xs text-red-600">
                          {fieldErrors.phone}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="quote-city">
                        {t.results.citySelectLabel}
                      </Label>
                      <Select
                        id="quote-city"
                        value={quoteCity}
                        onChange={(e) =>
                          setQuoteCity(e.target.value as EthiopianCity)
                        }
                      >
                        {ETHIOPIAN_CITIES.map((c) => (
                          <option key={c} value={c}>
                            {translateCityName(c, lang)}
                          </option>
                        ))}
                      </Select>
                      {fieldErrors.city && (
                        <p className="text-xs text-red-600">
                          {fieldErrors.city}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowQuoteForm(false)}
                      disabled={isSubmitting}
                    >
                      {t.results.cancelBtn}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-6 font-semibold"
                    >
                      {isSubmitting
                        ? t.results.submittingQuoteBtn
                        : t.results.submitQuoteBtn}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appliance Load Breakdown Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">
                {t.results.includedAppliancesTitle(
                  sessionState.appliances.length
                )}
              </CardTitle>
              <CardDescription>
                {t.results.includedAppliancesDesc(results.dailyKwh.toFixed(2))}
              </CardDescription>
            </div>
            <Link href={`/?lang=${lang}`}>
              <Button variant="outline" size="sm">
                {t.results.editListBtn}
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <Separator className="mb-2" />
          <div className="divide-y divide-slate-100 text-sm">
            {sessionState.appliances.map((item) => {
              const itemKwh =
                (item.watts * item.quantity * item.hoursPerDay) / 1000;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 py-2"
                >
                  <div className="min-w-0">
                    <span className="font-medium text-slate-900">
                      {translateApplianceName(item.name, lang)}
                    </span>
                    <span className="ml-2 text-xs text-slate-500">
                      {item.quantity} × {item.watts}W × {item.hoursPerDay}{" "}
                      {t.results.hoursPerDayShort}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-semibold text-slate-800 shrink-0">
                    {itemKwh.toFixed(2)} kWh
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-sm text-slate-500">
          <div className="size-7 animate-spin rounded-full border-3 border-amber-200 border-t-amber-600" />
          <span>የሶላር መጠን እና የዋጋ ግምት በማስላት ላይ... / Calculating...</span>
        </div>
      }
    >
      <ResultsContent />
    </React.Suspense>
  );
}
