import { SOLAR_CONFIG, type SolarConfig } from "./config.ts";

export interface ApplianceInput {
  name?: string;
  watts: number;
  quantity: number;
  hoursPerDay: number;
}

export interface CalculatorInput {
  appliances: ApplianceInput[];
  peakSunHours: number;
  config?: Partial<SolarConfig>;
}

export interface CostRangeEtb {
  low: number;
  high: number;
  midpoint: number;
  equipmentCost: number;
}

export interface PaybackMonths {
  vsGrid: number;
  vsGenerator: number;
}

export interface CalculatorOutput {
  /** Total daily energy consumption in kWh */
  dailyKwh: number;
  /** Recommended solar PV array size in kW (accounting for 20% system losses) */
  recommendedPanelKw: number;
  /** Recommended battery bank capacity in kWh (accounting for 80% DoD and 1 day autonomy) */
  batteryKwh: number;
  /** Estimated total installed cost range in ETB (low / high / midpoint) */
  costRange: CostRangeEtb;
  /** Estimated monthly electricity bill savings compared to grid tariff (ETB/month) */
  monthlySavingsVsGrid: number;
  /** Estimated monthly fuel savings compared to backup generator (ETB/month) */
  monthlySavingsVsGenerator: number;
  /** Payback period in months (both vsGrid and vsGenerator) */
  paybackMonths: PaybackMonths;
  /** Convenience top-level payback in months vs grid */
  paybackMonthsVsGrid: number;
  /** Convenience top-level payback in months vs generator */
  paybackMonthsVsGenerator: number;
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Computes total daily energy demand in kWh for a list of appliances.
 * Formula: sum(watts * quantity * hoursPerDay) / 1000
 */
export function calculateDailyKwh(appliances: ApplianceInput[]): number {
  let totalWh = 0;

  for (const item of appliances) {
    const watts = Math.max(0, Number(item.watts) || 0);
    const quantity = Math.max(0, Number(item.quantity) || 0);
    const hoursPerDay = Math.min(24, Math.max(0, Number(item.hoursPerDay) || 0));
    totalWh += watts * quantity * hoursPerDay;
  }

  return roundTo(totalWh / 1000, 4);
}

/**
 * Calculates solar PV sizing, battery capacity, ETB cost range, monthly savings,
 * and payback period in months.
 *
 * Can be called either as:
 *   `calculateSolarSystem({ appliances, peakSunHours, config })`
 * or:
 *   `calculateSolarSystem(appliances, peakSunHours, config)`
 */
export function calculateSolarSystem(
  inputOrAppliances: CalculatorInput | ApplianceInput[],
  peakSunHoursArg?: number,
  configOverrideArg?: Partial<SolarConfig>
): CalculatorOutput {
  const isObjectInput = !Array.isArray(inputOrAppliances);

  const appliances = isObjectInput
    ? inputOrAppliances.appliances
    : inputOrAppliances;
  const peakSunHours = isObjectInput
    ? inputOrAppliances.peakSunHours
    : (peakSunHoursArg ?? 0);
  const configOverrides = isObjectInput
    ? inputOrAppliances.config
    : configOverrideArg;

  const cfg: SolarConfig = {
    ...SOLAR_CONFIG,
    ...configOverrides,
  };

  const dailyKwh = calculateDailyKwh(appliances);

  if (dailyKwh <= 0 || peakSunHours <= 0) {
    return {
      dailyKwh,
      recommendedPanelKw: 0,
      batteryKwh: 0,
      costRange: {
        low: 0,
        high: 0,
        midpoint: 0,
        equipmentCost: 0,
      },
      monthlySavingsVsGrid: 0,
      monthlySavingsVsGenerator: 0,
      paybackMonths: {
        vsGrid: 0,
        vsGenerator: 0,
      },
      paybackMonthsVsGrid: 0,
      paybackMonthsVsGenerator: 0,
    };
  }

  // 1. Recommended Panel kW:
  // Account for system losses (e.g. 20% losses -> 80% effective efficiency):
  // panelKw = dailyKwh / (peakSunHours * (1 - systemLosses))
  const effectiveEfficiency = 1 - cfg.systemLosses;
  const rawPanelKw = dailyKwh / (peakSunHours * effectiveEfficiency);
  const recommendedPanelKw = roundTo(rawPanelKw, 3);

  // 2. Recommended Battery kWh:
  // Account for 1 day autonomy and 80% Depth of Discharge (DoD):
  // batteryKwh = (dailyKwh * batteryAutonomyDays) / batteryDepthOfDischarge
  const rawBatteryKwh =
    (dailyKwh * cfg.batteryAutonomyDays) / cfg.batteryDepthOfDischarge;
  const batteryKwh = roundTo(rawBatteryKwh, 3);

  // 3. Cost Range (ETB):
  // Base equipment cost uses unrounded or rounded kW/kWh consistently (using recommendedPanelKw and batteryKwh so hand-checking matches displayed numbers)
  const equipmentCost = roundTo(
    recommendedPanelKw * cfg.panelCostPerKwEtb +
      batteryKwh * cfg.batteryCostPerKwhEtb,
    2
  );
  const midpointCost = roundTo(
    equipmentCost * (1 + cfg.installationOverheadPct),
    2
  );
  const lowCost = roundTo(midpointCost * (1 - cfg.costRangeVariancePct), 2);
  const highCost = roundTo(midpointCost * (1 + cfg.costRangeVariancePct), 2);

  // 4. Monthly Savings (ETB/month):
  const monthlyKwh = dailyKwh * cfg.daysPerMonth;
  const monthlySavingsVsGrid = roundTo(
    monthlyKwh * cfg.gridTariffPerKwhEtb,
    2
  );
  const monthlySavingsVsGenerator = roundTo(
    monthlyKwh * cfg.generatorFuelCostPerKwhEtb,
    2
  );

  // 5. Payback in months (using midpoint installed cost):
  const paybackMonthsVsGrid =
    monthlySavingsVsGrid > 0
      ? roundTo(midpointCost / monthlySavingsVsGrid, 1)
      : 0;
  const paybackMonthsVsGenerator =
    monthlySavingsVsGenerator > 0
      ? roundTo(midpointCost / monthlySavingsVsGenerator, 1)
      : 0;

  return {
    dailyKwh,
    recommendedPanelKw,
    batteryKwh,
    costRange: {
      low: lowCost,
      high: highCost,
      midpoint: midpointCost,
      equipmentCost,
    },
    monthlySavingsVsGrid,
    monthlySavingsVsGenerator,
    paybackMonths: {
      vsGrid: paybackMonthsVsGrid,
      vsGenerator: paybackMonthsVsGenerator,
    },
    paybackMonthsVsGrid,
    paybackMonthsVsGenerator,
  };
}
