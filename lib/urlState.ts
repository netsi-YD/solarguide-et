import {
  PROFILE_PRESETS,
  getDefaultEssentialForName,
  type ProfilePresetId,
} from "./appliances.ts";
import {
  ETHIOPIAN_CITIES,
  type EthiopianCity,
} from "./sunHours.ts";
import { SOLAR_CONFIG } from "./config.ts";

export interface EditableApplianceItem {
  id: string;
  name: string;
  watts: number;
  quantity: number;
  hoursPerDay: number;
  essential: boolean;
}

export type PresetSelection = ProfilePresetId | "custom";

export interface CalculatorSessionState {
  preset: PresetSelection;
  city: EthiopianCity;
  outageHoursPerDay: number;
  appliances: EditableApplianceItem[];
}

export const STORAGE_KEY = "solarguide_et_calculator_state_v1";

export function getDefaultAppliancesForPreset(
  preset: ProfilePresetId
): EditableApplianceItem[] {
  const profile = PROFILE_PRESETS[preset] ?? PROFILE_PRESETS.home;
  return profile.appliances.map((item, idx) => ({
    id: `${item.applianceId}-${idx}`,
    name: item.name,
    watts: item.watts,
    quantity: item.quantity,
    hoursPerDay: item.hoursPerDay,
    essential: item.essential,
  }));
}

export function encodeCalculatorSearchParams(
  state: CalculatorSessionState
): string {
  const params = new URLSearchParams();
  params.set("city", state.city);
  params.set("preset", state.preset);
  params.set("outage", String(state.outageHoursPerDay));
  const compact = state.appliances.map((item) => ({
    n: item.name,
    w: item.watts,
    q: item.quantity,
    h: item.hoursPerDay,
    e: item.essential ? 1 : 0,
  }));
  params.set("items", JSON.stringify(compact));
  return params.toString();
}

export function decodeCalculatorSearchParams(searchParams: {
  get(key: string): string | null;
}): CalculatorSessionState {
  const rawCity = searchParams.get("city");
  const city: EthiopianCity =
    rawCity && ETHIOPIAN_CITIES.includes(rawCity as EthiopianCity)
      ? (rawCity as EthiopianCity)
      : "Addis Ababa";

  const rawPreset = searchParams.get("preset");
  const preset: PresetSelection =
    rawPreset === "home" ||
    rawPreset === "small-shop" ||
    rawPreset === "clinic" ||
    rawPreset === "custom"
      ? rawPreset
      : "home";

  const rawOutage = searchParams.get("outage");
  const outageHoursPerDay = Math.min(
    SOLAR_CONFIG.maxOutageHoursPerDay,
    Math.max(
      0,
      rawOutage !== null
        ? Number(rawOutage) || 0
        : SOLAR_CONFIG.defaultOutageHoursPerDay
    )
  );

  const rawItems = searchParams.get("items");
  if (rawItems) {
    try {
      const parsed = JSON.parse(rawItems) as Array<{
        n?: string;
        w?: number;
        q?: number;
        h?: number;
        e?: number | boolean;
      }>;
      if (Array.isArray(parsed) && parsed.length > 0) {
        const appliances: EditableApplianceItem[] = parsed.map((entry, idx) => {
          const name = String(entry.n || "Appliance");
          const essential =
            entry.e !== undefined
              ? Boolean(entry.e)
              : getDefaultEssentialForName(name);
          return {
            id: `item-${idx}`,
            name,
            watts: Math.max(0, Number(entry.w) || 0),
            quantity: Math.max(1, Number(entry.q) || 1),
            hoursPerDay: Math.min(24, Math.max(0.5, Number(entry.h) || 1)),
            essential,
          };
        });
        return { preset, city, outageHoursPerDay, appliances };
      }
    } catch {
      // Fall through to default preset appliances
    }
  }

  const fallbackPreset: ProfilePresetId =
    preset === "custom" ? "home" : preset;
  return {
    preset,
    city,
    outageHoursPerDay,
    appliances: getDefaultAppliancesForPreset(fallbackPreset),
  };
}
