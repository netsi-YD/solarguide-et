import {
  PROFILE_PRESETS,
  type ProfilePresetId,
} from "./appliances.ts";
import {
  ETHIOPIAN_CITIES,
  type EthiopianCity,
} from "./sunHours.ts";

export interface EditableApplianceItem {
  id: string;
  name: string;
  watts: number;
  quantity: number;
  hoursPerDay: number;
}

export type PresetSelection = ProfilePresetId | "custom";

export interface CalculatorSessionState {
  preset: PresetSelection;
  city: EthiopianCity;
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
  }));
}

export function encodeCalculatorSearchParams(
  state: CalculatorSessionState
): string {
  const params = new URLSearchParams();
  params.set("city", state.city);
  params.set("preset", state.preset);
  const compact = state.appliances.map((item) => ({
    n: item.name,
    w: item.watts,
    q: item.quantity,
    h: item.hoursPerDay,
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

  const rawItems = searchParams.get("items");
  if (rawItems) {
    try {
      const parsed = JSON.parse(rawItems) as Array<{
        n?: string;
        w?: number;
        q?: number;
        h?: number;
      }>;
      if (Array.isArray(parsed) && parsed.length > 0) {
        const appliances: EditableApplianceItem[] = parsed.map((entry, idx) => ({
          id: `item-${idx}`,
          name: String(entry.n || "Appliance"),
          watts: Math.max(0, Number(entry.w) || 0),
          quantity: Math.max(1, Number(entry.q) || 1),
          hoursPerDay: Math.min(24, Math.max(0.5, Number(entry.h) || 1)),
        }));
        return { preset, city, appliances };
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
    appliances: getDefaultAppliancesForPreset(fallbackPreset),
  };
}
