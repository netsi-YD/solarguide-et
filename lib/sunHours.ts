export type EthiopianCity =
  | "Addis Ababa"
  | "Gondar"
  | "Bahir Dar"
  | "Hawassa"
  | "Mekelle"
  | "Dire Dawa"
  | "Jimma"
  | "Adama";

export interface CitySunData {
  city: EthiopianCity;
  peakSunHours: number;
  latitude: number;
  longitude: number;
}

/**
 * Fallback table of average daily peak sun hours (kWh/m²/day) for major Ethiopian cities.
 */
export const FALLBACK_SUN_HOURS: Record<EthiopianCity, CitySunData> = {
  "Addis Ababa": {
    city: "Addis Ababa",
    peakSunHours: 5.6,
    latitude: 9.03,
    longitude: 38.74,
  },
  Gondar: {
    city: "Gondar",
    peakSunHours: 6.0,
    latitude: 12.6,
    longitude: 37.47,
  },
  "Bahir Dar": {
    city: "Bahir Dar",
    peakSunHours: 5.9,
    latitude: 11.59,
    longitude: 37.39,
  },
  Hawassa: {
    city: "Hawassa",
    peakSunHours: 5.5,
    latitude: 7.06,
    longitude: 38.48,
  },
  Mekelle: {
    city: "Mekelle",
    peakSunHours: 6.2,
    latitude: 13.5,
    longitude: 39.47,
  },
  "Dire Dawa": {
    city: "Dire Dawa",
    peakSunHours: 6.1,
    latitude: 9.6,
    longitude: 41.87,
  },
  Jimma: {
    city: "Jimma",
    peakSunHours: 5.1,
    latitude: 7.67,
    longitude: 36.83,
  },
  Adama: {
    city: "Adama",
    peakSunHours: 5.8,
    latitude: 8.54,
    longitude: 39.27,
  },
};

export const ETHIOPIAN_CITIES: EthiopianCity[] = Object.keys(
  FALLBACK_SUN_HOURS
) as EthiopianCity[];

export interface SunHoursResult {
  city: EthiopianCity;
  peakSunHours: number;
  source: "fallback" | "nasa-power";
}

export interface FetchSunHoursOptions {
  /** If true, attempts to fetch annual average insolation from NASA POWER API first. */
  useNasaApi?: boolean;
  /** Optional custom fetch implementation (useful for unit tests). */
  fetchImpl?: typeof fetch;
  /** Request timeout in milliseconds (default: 4000ms). */
  timeoutMs?: number;
}

/**
 * Synchronously retrieves fallback peak sun hours for the given Ethiopian city.
 */
export function getFallbackSunHours(city: EthiopianCity): number {
  const entry = FALLBACK_SUN_HOURS[city];
  if (!entry) {
    return FALLBACK_SUN_HOURS["Addis Ababa"].peakSunHours;
  }
  return entry.peakSunHours;
}

/**
 * Retrieves peak sun hours for a city, optionally querying the NASA POWER API
 * (`ALLSKY_SFC_SW_DWN` climatology parameter) and automatically falling back
 * to `FALLBACK_SUN_HOURS` if the network request fails or returns unexpected data.
 */
export async function getSunHours(
  city: EthiopianCity,
  options: FetchSunHoursOptions = {}
): Promise<SunHoursResult> {
  const fallbackEntry = FALLBACK_SUN_HOURS[city] ?? FALLBACK_SUN_HOURS["Addis Ababa"];
  const resolvedCity = fallbackEntry.city;

  if (!options.useNasaApi) {
    return {
      city: resolvedCity,
      peakSunHours: fallbackEntry.peakSunHours,
      source: "fallback",
    };
  }

  const fetchFn = options.fetchImpl ?? globalThis.fetch;
  if (typeof fetchFn !== "function") {
    return {
      city: resolvedCity,
      peakSunHours: fallbackEntry.peakSunHours,
      source: "fallback",
    };
  }

  const timeoutMs = options.timeoutMs ?? 4000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url =
      `https://power.larc.nasa.gov/api/temporal/climatology/point` +
      `?parameters=ALLSKY_SFC_SW_DWN` +
      `&community=RE` +
      `&longitude=${fallbackEntry.longitude}` +
      `&latitude=${fallbackEntry.latitude}` +
      `&format=JSON`;

    const response = await fetchFn(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`NASA POWER API responded with status ${response.status}`);
    }

    const data = (await response.json()) as {
      properties?: {
        parameter?: {
          ALLSKY_SFC_SW_DWN?: {
            ANN?: number;
          };
        };
      };
    };

    const annualIrradiance = data?.properties?.parameter?.ALLSKY_SFC_SW_DWN?.ANN;
    if (
      typeof annualIrradiance === "number" &&
      Number.isFinite(annualIrradiance) &&
      annualIrradiance > 0 &&
      annualIrradiance < 12
    ) {
      return {
        city: resolvedCity,
        peakSunHours: Math.round(annualIrradiance * 100) / 100,
        source: "nasa-power",
      };
    }

    return {
      city: resolvedCity,
      peakSunHours: fallbackEntry.peakSunHours,
      source: "fallback",
    };
  } catch {
    return {
      city: resolvedCity,
      peakSunHours: fallbackEntry.peakSunHours,
      source: "fallback",
    };
  } finally {
    clearTimeout(timer);
  }
}
