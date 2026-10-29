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
    city: string;
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

    const validation = validateQuoteForm({
      name: quoteName,
      phone: quotePhone,
      city: quoteCity,
    });

    if (!validation.valid) {
      setFieldErrors(validation.errors);
      return;
    }

    setFieldErrors({});

    if (!isSupabaseConfigured()) {
      setSubmitError(
        "Supabase is not configured yet. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local and restart the server."
      );
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      setSubmitError("Unable to initialize Supabase client.");
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
        city: validation.sanitized.city,
        panelKw: results.recommendedPanelKw,
        batteryKwh: results.batteryKwh,
        costLow: results.costRange.low,
        costHigh: results.costRange.high,
      });
      setQuoteName("");
      setQuotePhone("");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong while saving your quote request. Please try again.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Top navigation & summary header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" />
          Back to Appliance Editor
        </Link>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="gap-1 bg-amber-50 text-amber-900 border-amber-200"
          >
            <MapPin className="size-3.5 text-amber-600" />
            {cityData.city} ({cityData.peakSunHours} peak sun hrs)
          </Badge>
        </div>
      </div>

      <section className="flex flex-col gap-1.5">
        <Badge
          variant="secondary"
          className="bg-emerald-100 text-emerald-900 border-emerald-200"
        >
          Step 2 of 2 • Recommended Solar System
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Your Solar Sizing & Cost Estimate
        </h1>
        <p className="text-sm text-slate-600">
          Based on{" "}
          <span className="font-semibold text-slate-800">
            {sessionState.appliances.length}{" "}
            {sessionState.appliances.length === 1
              ? "appliance group"
              : "appliance groups"}
          </span>{" "}
          in{" "}
          <span className="font-semibold text-slate-800">{cityData.city}</span>.
        </p>
      </section>

      {/* Primary Sizing Metrics Grid: Daily kWh, Recommended Panel kW, Battery kWh */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Daily Energy Use
              </span>
              <Zap className="size-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {results.dailyKwh.toFixed(2)}{" "}
              <span className="text-base font-medium text-slate-500">
                kWh/day
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {Math.round(results.dailyKwh * 1000)} Wh/day •{" "}
              {(results.dailyKwh * config.daysPerMonth).toFixed(1)} kWh/month
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200/80 bg-amber-50/40">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-amber-900/80">
                Recommended Panel Size
              </span>
              <Sun className="size-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {results.recommendedPanelKw.toFixed(2)}{" "}
              <span className="text-base font-medium text-slate-600">kW</span>
            </div>
            <p className="text-xs text-slate-600">
              Includes {Math.round(config.systemLosses * 100)}% system loss
              allowance at {cityData.peakSunHours}h sun
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/80 bg-emerald-50/40">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-emerald-900/80">
                Recommended Battery
              </span>
              <BatteryCharging className="size-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {results.batteryKwh.toFixed(2)}{" "}
              <span className="text-base font-medium text-slate-600">kWh</span>
            </div>
            <p className="text-xs text-slate-600">
              {config.batteryAutonomyDays} day autonomy at{" "}
              {Math.round(config.batteryDepthOfDischarge * 100)}% depth of
              discharge
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Estimated Cost Range in ETB */}
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Banknote className="size-4.5" />
              </span>
              <div>
                <CardTitle className="text-base sm:text-lg">
                  Estimated System Cost Range (ETB)
                </CardTitle>
                <CardDescription>
                  Includes solar panels, battery storage, and{" "}
                  {Math.round(config.installationOverheadPct * 100)}%
                  installation overhead
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              Estimate (Assumption)
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="gap-4">
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-amber-900/70">
                Estimated Installed Cost Range
              </span>
              <div className="text-2xl font-extrabold text-slate-900 sm:text-3xl mt-0.5">
                {formatEtb(results.costRange.low)} –{" "}
                {formatEtb(results.costRange.high)}{" "}
                <span className="text-base font-semibold text-slate-600">
                  ETB
                </span>
              </div>
            </div>
            <div className="text-xs text-slate-600">
              Midpoint estimate:{" "}
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
                  Compared to Backup Generator
                </span>
                <TrendingUp className="size-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500">Monthly Savings:</span>
                <span className="text-base font-bold text-emerald-700">
                  {formatEtb(results.monthlySavingsVsGenerator)} ETB / mo
                </span>
              </div>
              <div className="flex items-baseline justify-between border-t border-slate-100 pt-2">
                <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                  <Clock className="size-3" /> Payback Time:
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  {results.paybackMonths.vsGenerator} months{" "}
                  <span className="text-xs font-normal text-slate-500">
                    (~{(results.paybackMonths.vsGenerator / 12).toFixed(1)} yrs)
                  </span>
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  Compared to Grid Tariff (EEU)
                </span>
                <TrendingUp className="size-4 text-blue-600" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500">Monthly Savings:</span>
                <span className="text-base font-bold text-blue-700">
                  {formatEtb(results.monthlySavingsVsGrid)} ETB / mo
                </span>
              </div>
              <div className="flex items-baseline justify-between border-t border-slate-100 pt-2">
                <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                  <Clock className="size-3" /> Payback Time:
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  {results.paybackMonths.vsGrid} months{" "}
                  <span className="text-xs font-normal text-slate-500">
                    (~{(results.paybackMonths.vsGrid / 12).toFixed(1)} yrs)
                  </span>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clear Note on Editable Assumptions */}
      <Alert className="border-amber-300/80 bg-amber-50/70">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Info className="size-4.5 text-amber-700 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <AlertTitle className="text-amber-950">
                Note: Costs & Savings Are Estimates Based on Editable
                Assumptions
              </AlertTitle>
              <AlertDescription className="text-amber-900/90">
                All equipment prices, installation overhead (
                {Math.round(config.installationOverheadPct * 100)}%), system
                losses ({Math.round(config.systemLosses * 100)}%), battery depth
                of discharge ({Math.round(config.batteryDepthOfDischarge * 100)}
                %), grid tariff ({config.gridTariffPerKwhEtb} ETB/kWh), and
                generator fuel cost ({config.generatorFuelCostPerKwhEtb}{" "}
                ETB/kWh) are planning assumptions from{" "}
                <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[11px]">
                  /lib/config.ts
                </code>
                . You can inspect or edit these assumptions below.
              </AlertDescription>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAssumptionsEditor((prev) => !prev)}
            className="shrink-0 border-amber-300 bg-white text-amber-950 hover:bg-amber-100/60"
          >
            <SlidersHorizontal className="size-3.5" />
            {showAssumptionsEditor ? "Hide Assumptions" : "Edit Assumptions"}
          </Button>
        </div>

        {showAssumptionsEditor && (
          <div className="mt-3 border-t border-amber-200/80 pt-3 flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor="cfg-panel-cost" className="text-amber-950">
                  Panel Cost (ETB/kW) [Assumption]
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
                  Battery Cost (ETB/kWh) [Assumption]
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
                  Install Overhead (%) [Assumption]
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
                  Grid Tariff (ETB/kWh) [Assumption]
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
                  Generator Fuel (ETB/kWh) [Assumption]
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
                  Reset Default Assumptions
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-amber-900/80 sm:grid-cols-4">
              {ASSUMPTION_DETAILS.map((item) => (
                <div
                  key={item.key}
                  className="rounded-lg border border-amber-200/60 bg-white/70 px-2.5 py-1.5"
                >
                  <div className="font-medium text-amber-950">{item.label}</div>
                  <div>
                    Default: {item.value} {item.unit}
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
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Ready for real installer pricing in {cityData.city}?
                </h2>
                <Badge
                  variant="secondary"
                  className="bg-amber-100 text-amber-900 text-[11px]"
                >
                  Free Quote Request
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-600">
                Request quotes from solar installers in Ethiopia for a{" "}
                <span className="font-semibold text-slate-800">
                  {results.recommendedPanelKw.toFixed(2)} kW panel +{" "}
                {results.batteryKwh.toFixed(2)} kWh battery
                </span>{" "}
                system.
              </p>
            </div>

            {!showQuoteForm && (
              <Button
                type="button"
                size="lg"
                onClick={handleOpenQuoteForm}
                className="h-12 w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white px-7 text-base font-bold shadow-sm"
              >
                <MessageSquareQuote className="size-5" />
                Get quotes
              </Button>
            )}
          </div>

          {/* Quote Request Form or Confirmation Screen */}
          {showQuoteForm && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              {submittedQuote ? (
                <div
                  role="status"
                  className="flex flex-col items-center text-center gap-3 py-4"
                >
                  <span className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="size-7" />
                  </span>
                  <div className="flex flex-col gap-1 max-w-md">
                    <h3 className="text-lg font-bold text-slate-900">
                      Quote Request Received!
                    </h3>
                    <p className="text-sm text-slate-600">
                      Thank you,{" "}
                      <span className="font-semibold text-slate-900">
                        {submittedQuote.name}
                      </span>
                      . Your request for a{" "}
                      <span className="font-semibold text-slate-900">
                        {submittedQuote.panelKw.toFixed(2)} kW panel /{" "}
                        {submittedQuote.batteryKwh.toFixed(2)} kWh battery
                      </span>{" "}
                      system in{" "}
                      <span className="font-semibold text-slate-900">
                        {submittedQuote.city}
                      </span>{" "}
                      (estimated {formatEtb(submittedQuote.costLow)} –{" "}
                      {formatEtb(submittedQuote.costHigh)} ETB) has been saved.
                      Installers will contact you at{" "}
                      <span className="font-semibold text-slate-900">
                        {submittedQuote.phone}
                      </span>
                      .
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
                      Done
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setSubmittedQuote(null)}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      Submit Another Request
                    </Button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleQuoteSubmit}
                  noValidate
                  className="flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base text-slate-900">
                        Request Solar Installer Quotes
                      </h3>
                      <p className="text-xs text-slate-500">
                        Your calculated system size (
                        {results.recommendedPanelKw.toFixed(2)} kW panel,{" "}
                        {results.batteryKwh.toFixed(2)} kWh battery) will be
                        included automatically.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setShowQuoteForm(false)}
                      aria-label="Close quote form"
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
                            Could not submit quote request
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
                      <Label htmlFor="quote-name">Full Name *</Label>
                      <Input
                        id="quote-name"
                        placeholder="e.g. Abebe Bikila"
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
                      <Label htmlFor="quote-phone">Phone Number *</Label>
                      <Input
                        id="quote-phone"
                        type="tel"
                        placeholder="e.g. 0911234567 or +251911234567"
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
                      <Label htmlFor="quote-city">City *</Label>
                      <Select
                        id="quote-city"
                        value={quoteCity}
                        onChange={(e) =>
                          setQuoteCity(e.target.value as EthiopianCity)
                        }
                      >
                        {ETHIOPIAN_CITIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
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
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-6 font-semibold"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Quote Request"}
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                Included Appliances ({sessionState.appliances.length})
              </CardTitle>
              <CardDescription>
                Breakdown of your {results.dailyKwh.toFixed(2)} kWh/day load
              </CardDescription>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm">
                Edit List
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
                  className="flex items-center justify-between py-2"
                >
                  <div>
                    <span className="font-medium text-slate-900">
                      {item.name}
                    </span>
                    <span className="ml-2 text-xs text-slate-500">
                      {item.quantity} × {item.watts}W × {item.hoursPerDay}h/day
                    </span>
                  </div>
                  <span className="font-mono text-xs font-semibold text-slate-800">
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
        <div className="py-12 text-center text-sm text-slate-500">
          Calculating solar sizing and ETB cost estimates...
        </div>
      }
    >
      <ResultsContent />
    </React.Suspense>
  );
}
