export type ApplianceId =
  | "led-bulb"
  | "phone-charger"
  | "tv"
  | "laptop"
  | "fridge"
  | "fan"
  | "water-pump"
  | "sewing-machine"
  | "shop-freezer"
  | "clinic-vaccine-fridge";

export interface AppliancePreset {
  id: ApplianceId;
  name: string;
  watts: number;
  defaultQuantity: number;
  defaultHoursPerDay: number;
}

export interface PresetApplianceEntry {
  applianceId: ApplianceId;
  name: string;
  watts: number;
  quantity: number;
  hoursPerDay: number;
}

export type ProfilePresetId = "home" | "small-shop" | "clinic";

export interface ProfilePreset {
  id: ProfilePresetId;
  name: "Home" | "Small Shop" | "Clinic";
  description: string;
  appliances: PresetApplianceEntry[];
}

/**
 * Preset list of common Ethiopian household, commercial, and health clinic appliances
 * with typical wattage ratings.
 */
export const APPLIANCE_PRESETS: AppliancePreset[] = [
  {
    id: "led-bulb",
    name: "LED bulb",
    watts: 10,
    defaultQuantity: 4,
    defaultHoursPerDay: 5,
  },
  {
    id: "phone-charger",
    name: "Phone charger",
    watts: 15,
    defaultQuantity: 2,
    defaultHoursPerDay: 3,
  },
  {
    id: "tv",
    name: "TV",
    watts: 80,
    defaultQuantity: 1,
    defaultHoursPerDay: 4,
  },
  {
    id: "laptop",
    name: "Laptop",
    watts: 60,
    defaultQuantity: 1,
    defaultHoursPerDay: 6,
  },
  {
    id: "fridge",
    name: "Fridge",
    watts: 150,
    defaultQuantity: 1,
    defaultHoursPerDay: 8,
  },
  {
    id: "fan",
    name: "Fan",
    watts: 50,
    defaultQuantity: 1,
    defaultHoursPerDay: 6,
  },
  {
    id: "water-pump",
    name: "Water pump",
    watts: 750,
    defaultQuantity: 1,
    defaultHoursPerDay: 1,
  },
  {
    id: "sewing-machine",
    name: "Sewing machine",
    watts: 100,
    defaultQuantity: 1,
    defaultHoursPerDay: 6,
  },
  {
    id: "shop-freezer",
    name: "Shop freezer",
    watts: 250,
    defaultQuantity: 1,
    defaultHoursPerDay: 10,
  },
  {
    id: "clinic-vaccine-fridge",
    name: "Clinic vaccine fridge",
    watts: 120,
    defaultQuantity: 1,
    defaultHoursPerDay: 12,
  },
];

/**
 * Quick-start profile presets for Home, Small Shop, and Clinic.
 */
export const PROFILE_PRESETS: Record<ProfilePresetId, ProfilePreset> = {
  home: {
    id: "home",
    name: "Home",
    description: "Typical household lighting, phone charging, TV, and refrigerator",
    appliances: [
      {
        applianceId: "led-bulb",
        name: "LED bulb",
        watts: 10,
        quantity: 4,
        hoursPerDay: 5,
      },
      {
        applianceId: "phone-charger",
        name: "Phone charger",
        watts: 15,
        quantity: 2,
        hoursPerDay: 3,
      },
      {
        applianceId: "tv",
        name: "TV",
        watts: 80,
        quantity: 1,
        hoursPerDay: 4,
      },
      {
        applianceId: "fridge",
        name: "Fridge",
        watts: 150,
        quantity: 1,
        hoursPerDay: 8,
      },
    ],
  },
  "small-shop": {
    id: "small-shop",
    name: "Small Shop",
    description: "Retail shop with lighting, phone charging, fan, and a commercial freezer",
    appliances: [
      {
        applianceId: "led-bulb",
        name: "LED bulb",
        watts: 10,
        quantity: 3,
        hoursPerDay: 8,
      },
      {
        applianceId: "phone-charger",
        name: "Phone charger",
        watts: 15,
        quantity: 2,
        hoursPerDay: 4,
      },
      {
        applianceId: "fan",
        name: "Fan",
        watts: 50,
        quantity: 1,
        hoursPerDay: 8,
      },
      {
        applianceId: "shop-freezer",
        name: "Shop freezer",
        watts: 250,
        quantity: 1,
        hoursPerDay: 10,
      },
    ],
  },
  clinic: {
    id: "clinic",
    name: "Clinic",
    description: "Rural health post with vaccine cold-chain fridge, lighting, laptop, and fans",
    appliances: [
      {
        applianceId: "led-bulb",
        name: "LED bulb",
        watts: 10,
        quantity: 6,
        hoursPerDay: 8,
      },
      {
        applianceId: "clinic-vaccine-fridge",
        name: "Clinic vaccine fridge",
        watts: 120,
        quantity: 1,
        hoursPerDay: 12,
      },
      {
        applianceId: "laptop",
        name: "Laptop",
        watts: 60,
        quantity: 1,
        hoursPerDay: 6,
      },
      {
        applianceId: "fan",
        name: "Fan",
        watts: 50,
        quantity: 2,
        hoursPerDay: 6,
      },
      {
        applianceId: "phone-charger",
        name: "Phone charger",
        watts: 15,
        quantity: 2,
        hoursPerDay: 4,
      },
    ],
  },
};

export const PROFILE_PRESET_LIST: ProfilePreset[] = Object.values(PROFILE_PRESETS);

export function getApplianceById(id: ApplianceId): AppliancePreset | undefined {
  return APPLIANCE_PRESETS.find((item) => item.id === id);
}
