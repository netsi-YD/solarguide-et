import { SOLAR_CONFIG, type SolarConfig } from "./config.ts";
import { getDefaultEssentialForName } from "./appliances.ts";

export interface ApplianceInput {
  name?: string;
  watts: number;
  quantity: number;
  hoursPerDay: number;
  essential?: boolean;
}

export interface CalculatorInput {
  appliances: ApplianceInput[];
  peakSunHours: number;
  outageHoursPerDay?: number;
  config?: Partial<SolarConfig>;
}

export interface CostRangeEtb {
  low: number;
  high: number;
  midpoint: number;
  equipmentCost: number;
}

export interface BackupCostRangeEtb {
  low: number;
  high: number;
  midpoint: number;
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
  /** Outage hours per day used for backup calculation (0 to 12) */
  outageHoursPerDay: number;
  /** Daily energy consumption of essential appliances in kWh */
  essentialDailyKwh: number;
  /** Combined running power of essential appliances in kW: sum(watts * quantity) / 1000 */
  essentialPowerKw: number;
  /** Energy needed during power cut in kWh: min(essentialPowerKw * outageHoursPerDay, essentialDailyKwh) */
  backupEnergyKwh: number;
  /** Battery capacity needed for backup in kWh: backupEnergyKwh / batteryDepthOfDischarge */
  backupBatteryKwh: number;
  /** Extra battery cost range in ETB (low / high / midpoint) for the backup battery */
  backupExtraCost: BackupCostRangeEtb;
  /** Percentage of total daily kWh belonging to essential appliances (0 to 100) */
  coveredSharePercent: number;
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
 * payback period in months, and backup/outage mode sizing.
 *
 * Can be called either as:
 *   `calculateSolarSystem({ appliances, peakSunHours, outageHoursPerDay, config })`
 * or:
 *   `calculateSolarSystem(appliances, peakSunHours, config, outageHoursPerDay)`
 */
export function calculateSolarSystem(
  inputOrAppliances: CalculatorInput | ApplianceInput[],
  peakSunHoursArg?: number,
  configOverrideArg?: Partial<SolarConfig>,
  outageHoursPerDayArg?: number
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

  const rawOutageHours = isObjectInput
    ? (inputOrAppliances.outageHoursPerDay ?? cfg.defaultOutageHoursPerDay)
    : (outageHoursPerDayArg ?? cfg.defaultOutageHoursPerDay);

  const outageHoursPerDay = Math.min(
    cfg.maxOutageHoursPerDay,
    Math.max(0, Number(rawOutageHours) || 0)
  );

  const dailyKwh = calculateDailyKwh(appliances);

  // Compute essential appliances power & daily energy
  let essentialWh = 0;
  let essentialWattsTotal = 0;

  for (const item of appliances) {
    const isEssential =
      typeof item.essential === "boolean"
        ? item.essential
        : getDefaultEssentialForName(item.name);

    if (isEssential) {
      const watts = Math.max(0, Number(item.watts) || 0);
      const quantity = Math.max(0, Number(item.quantity) || 0);
      const hoursPerDay = Math.min(
        24,
        Math.max(0, Number(item.hoursPerDay) || 0)
      );
      essentialWattsTotal += watts * quantity;
      essentialWh += watts * quantity * hoursPerDay;
    }
  }

  const essentialPowerKw = roundTo(essentialWattsTotal / 1000, 4);
  const essentialDailyKwh = roundTo(essentialWh / 1000, 4);

  const coveredSharePercent =
    dailyKwh > 0 ? roundTo((essentialDailyKwh / dailyKwh) * 100, 1) : 0;

  const backupEnergyKwh =
    outageHoursPerDay > 0
      ? roundTo(
          Math.min(
            essentialPowerKw * outageHoursPerDay,
            essentialDailyKwh
          ),
          4
        )
      : 0;

  const backupBatteryKwh =
    backupEnergyKwh > 0 && cfg.batteryDepthOfDischarge > 0
      ? roundTo(backupEnergyKwh / cfg.batteryDepthOfDischarge, 3)
      : 0;

  const backupMidpointCost = roundTo(
    backupBatteryKwh * cfg.batteryCostPerKwhEtb,
    2
  );
  const backupLowCost = roundTo(
    backupMidpointCost * (1 - cfg.costRangeVariancePct),
    2
  );
  const backupHighCost = roundTo(
    backupMidpointCost * (1 + cfg.costRangeVariancePct),
    2
  );

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
      outageHoursPerDay,
      essentialDailyKwh,
      essentialPowerKw,
      backupEnergyKwh,
      backupBatteryKwh,
      backupExtraCost: {
        low: backupLowCost,
        high: backupHighCost,
        midpoint: backupMidpointCost,
      },
      coveredSharePercent,
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
    outageHoursPerDay,
    essentialDailyKwh,
    essentialPowerKw,
    backupEnergyKwh,
    backupBatteryKwh,
    backupExtraCost: {
      low: backupLowCost,
      high: backupHighCost,
      midpoint: backupMidpointCost,
    },
    coveredSharePercent,
  };
}
