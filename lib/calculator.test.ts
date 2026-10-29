import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { SOLAR_CONFIG, ASSUMPTION_DETAILS } from "./config.ts";
import {
  APPLIANCE_PRESETS,
  PROFILE_PRESETS,
  getApplianceById,
} from "./appliances.ts";
import {
  calculateDailyKwh,
  calculateSolarSystem,
} from "./calculator.ts";
import {
  ETHIOPIAN_CITIES,
  FALLBACK_SUN_HOURS,
  getFallbackSunHours,
  getSunHours,
} from "./sunHours.ts";

describe("Stage 1: Solar Calculator Logic & Supporting Modules", () => {
  describe("calculator.ts - Hand-checked examples", () => {
    it("calculates 0.05 kWh for a 10W LED bulb running for 5 hours", () => {
      const dailyKwh = calculateDailyKwh([
        { name: "LED bulb", watts: 10, quantity: 1, hoursPerDay: 5 },
      ]);
      assert.equal(dailyKwh, 0.05);

      const result = calculateSolarSystem(
        [{ name: "LED bulb", watts: 10, quantity: 1, hoursPerDay: 5 }],
        5.0
      );
      assert.equal(result.dailyKwh, 0.05);
      // 0.05 / (5 * 0.8) = 0.0125 -> rounded to 3 decimals = 0.013 kW
      assert.equal(result.recommendedPanelKw, 0.013);
      // 0.05 / 0.8 = 0.0625 -> rounded to 3 decimals = 0.063 kWh
      assert.equal(result.batteryKwh, 0.063);
    });

    it("matches exact hand-calculated sizing, cost range, savings, and payback for a 2.0 kWh/day load at 5.0 peak sun hours", () => {
      // Hand-checked example:
      // 1x 250W appliance running 8 hours/day = 2000 Wh = 2.0 kWh/day
      // Peak sun hours = 5.0
      // System losses = 20% -> effective factor = 0.80
      // Recommended Panel kW = 2.0 / (5.0 * 0.80) = 0.5 kW
      // Battery DoD = 80%, Autonomy = 1 day -> Battery kWh = (2.0 * 1) / 0.80 = 2.5 kWh
      // Equipment cost = (0.5 * 80,000) + (2.5 * 40,000) = 40,000 + 100,000 = 140,000 ETB
      // Midpoint cost (+15% installation overhead) = 140,000 * 1.15 = 161,000 ETB
      // Cost range (±15%): low = 161,000 * 0.85 = 136,850 ETB, high = 161,000 * 1.15 = 185,150 ETB
      // Monthly energy (30 days) = 2.0 * 30 = 60 kWh/month
      // Monthly savings vs grid (4 ETB/kWh) = 60 * 4 = 240 ETB/month
      // Monthly savings vs generator (45 ETB/kWh) = 60 * 45 = 2,700 ETB/month
      // Payback vs grid = 161,000 / 240 = 670.8 months
      // Payback vs generator = 161,000 / 2,700 = 59.6 months
      const result = calculateSolarSystem({
        appliances: [{ name: "Shop freezer", watts: 250, quantity: 1, hoursPerDay: 8 }],
        peakSunHours: 5.0,
      });

      assert.equal(result.dailyKwh, 2.0);
      assert.equal(result.recommendedPanelKw, 0.5);
      assert.equal(result.batteryKwh, 2.5);
      assert.equal(result.costRange.equipmentCost, 140_000);
      assert.equal(result.costRange.midpoint, 161_000);
      assert.equal(result.costRange.low, 136_850);
      assert.equal(result.costRange.high, 185_150);
      assert.equal(result.monthlySavingsVsGrid, 240);
      assert.equal(result.monthlySavingsVsGenerator, 2_700);
      assert.equal(result.paybackMonths.vsGrid, 670.8);
      assert.equal(result.paybackMonths.vsGenerator, 59.6);
      assert.equal(result.paybackMonthsVsGrid, 670.8);
      assert.equal(result.paybackMonthsVsGenerator, 59.6);
    });

    it("calculates multiple appliances accurately (Home preset hand-check)", () => {
      // Home preset:
      // 4x LED bulb (10W * 4 * 5h) = 200 Wh
      // 2x Phone charger (15W * 2 * 3h) = 90 Wh
      // 1x TV (80W * 1 * 4h) = 320 Wh
      // 1x Fridge (150W * 1 * 8h) = 1200 Wh
      // Total = 1810 Wh = 1.81 kWh/day
      const homeResult = calculateSolarSystem(
        PROFILE_PRESETS.home.appliances,
        FALLBACK_SUN_HOURS["Addis Ababa"].peakSunHours
      );

      assert.equal(homeResult.dailyKwh, 1.81);
      // 1.81 / (5.6 * 0.8) = 1.81 / 4.48 = 0.404017... -> 0.404 kW
      assert.equal(homeResult.recommendedPanelKw, 0.404);
      // 1.81 / 0.8 = 2.2625 -> 2.263 kWh
      assert.equal(homeResult.batteryKwh, 2.263);
    });

    it("handles empty appliance lists or zero sun hours safely", () => {
      const emptyResult = calculateSolarSystem([], 5.6);
      assert.equal(emptyResult.dailyKwh, 0);
      assert.equal(emptyResult.recommendedPanelKw, 0);
      assert.equal(emptyResult.batteryKwh, 0);
      assert.equal(emptyResult.costRange.low, 0);
      assert.equal(emptyResult.costRange.high, 0);
      assert.equal(emptyResult.monthlySavingsVsGrid, 0);
      assert.equal(emptyResult.monthlySavingsVsGenerator, 0);
      assert.equal(emptyResult.paybackMonths.vsGrid, 0);
      assert.equal(emptyResult.paybackMonths.vsGenerator, 0);
    });
  });

  describe("config.ts - Assumptions verification", () => {
    it("contains all required technical and ETB price assumptions", () => {
      assert.equal(SOLAR_CONFIG.systemLosses, 0.2);
      assert.equal(SOLAR_CONFIG.batteryDepthOfDischarge, 0.8);
      assert.equal(SOLAR_CONFIG.batteryAutonomyDays, 1);
      assert.ok(SOLAR_CONFIG.panelCostPerKwEtb > 0);
      assert.ok(SOLAR_CONFIG.batteryCostPerKwhEtb > 0);
      assert.ok(SOLAR_CONFIG.installationOverheadPct > 0);
      assert.ok(SOLAR_CONFIG.gridTariffPerKwhEtb > 0);
      assert.ok(SOLAR_CONFIG.generatorFuelCostPerKwhEtb > 0);

      for (const item of ASSUMPTION_DETAILS) {
        assert.equal(item.isAssumption, true);
        assert.ok(item.label.includes("Assumption"));
      }
    });
  });

  describe("appliances.ts - Presets verification", () => {
    it("includes all 10 required appliance presets and 3 profile presets", () => {
      assert.equal(APPLIANCE_PRESETS.length, 10);
      assert.ok(getApplianceById("led-bulb"));
      assert.ok(getApplianceById("phone-charger"));
      assert.ok(getApplianceById("tv"));
      assert.ok(getApplianceById("laptop"));
      assert.ok(getApplianceById("fridge"));
      assert.ok(getApplianceById("fan"));
      assert.ok(getApplianceById("water-pump"));
      assert.ok(getApplianceById("sewing-machine"));
      assert.ok(getApplianceById("shop-freezer"));
      assert.ok(getApplianceById("clinic-vaccine-fridge"));

      assert.equal(PROFILE_PRESETS.home.name, "Home");
      assert.equal(PROFILE_PRESETS["small-shop"].name, "Small Shop");
      assert.equal(PROFILE_PRESETS.clinic.name, "Clinic");
    });
  });

  describe("sunHours.ts - Fallback table and NASA POWER API fallback", () => {
    it("provides fallback peak sun hours for all 8 Ethiopian cities", () => {
      const expectedCities = [
        "Addis Ababa",
        "Gondar",
        "Bahir Dar",
        "Hawassa",
        "Mekelle",
        "Dire Dawa",
        "Jimma",
        "Adama",
      ] as const;

      for (const city of expectedCities) {
        assert.ok(ETHIOPIAN_CITIES.includes(city));
        const hours = getFallbackSunHours(city);
        assert.ok(hours >= 4.5 && hours <= 7.0);
      }
    });

    it("uses NASA POWER API value when enabled and valid, and falls back to table on failure", async () => {
      const mockSuccessFetch = (async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          properties: {
            parameter: {
              ALLSKY_SFC_SW_DWN: {
                ANN: 6.14,
              },
            },
          },
        }),
      })) as unknown as typeof fetch;

      const apiResult = await getSunHours("Addis Ababa", {
        useNasaApi: true,
        fetchImpl: mockSuccessFetch,
      });
      assert.equal(apiResult.source, "nasa-power");
      assert.equal(apiResult.peakSunHours, 6.14);

      const mockFailingFetch = (async () => {
        throw new Error("Network unreachable");
      }) as unknown as typeof fetch;

      const fallbackResult = await getSunHours("Bahir Dar", {
        useNasaApi: true,
        fetchImpl: mockFailingFetch,
      });
      assert.equal(fallbackResult.source, "fallback");
      assert.equal(
        fallbackResult.peakSunHours,
        FALLBACK_SUN_HOURS["Bahir Dar"].peakSunHours
      );
    });
  });
});
