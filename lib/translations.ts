import type { ApplianceId, ProfilePresetId } from "./appliances.ts";
import type { EthiopianCity } from "./sunHours.ts";
import type { SolarConfig } from "./config.ts";

export type Language = "am" | "en";

export const DEFAULT_LANGUAGE: Language = "am";
export const LANGUAGE_STORAGE_KEY = "solarguide_et_lang";

export interface TranslationDictionary {
  meta: {
    brandSubtitle: string;
    footerText: string;
    langToggleLabel: string;
  };
  home: {
    stepBadge: string;
    title: string;
    subtitle: string;
    step1Title: string;
    step1Desc: string;
    presets: Record<
      ProfilePresetId | "custom",
      {
        name: string;
        shortDesc: string;
      }
    >;
    step2Title: string;
    step2Desc: string;
    peakSunHoursBadge: (hours: number) => string;
    cityLabel: string;
    cityOptionLabel: (cityLabel: string, hours: number) => string;
    step3Title: string;
    step3Desc: string;
    itemsSummaryBadge: (count: number, kwh: string) => string;
    addCommonApplianceLabel: string;
    typicalWattsOption: (name: string, watts: number) => string;
    addApplianceBtn: string;
    customBtnOpen: string;
    customBtnCancel: string;
    customNameLabel: string;
    customNamePlaceholder: string;
    customWattsLabel: string;
    saveCustomBtn: string;
    emptyListTitle: string;
    emptyListDesc: string;
    wattsEachBadge: (watts: number) => string;
    dailyEnergyLabel: string;
    perDayUnit: string;
    quantityLabel: string;
    hoursPerDayLabel: string;
    removeAriaLabel: (name: string) => string;
    decreaseQtyAria: (name: string) => string;
    increaseQtyAria: (name: string) => string;
    decreaseHrsAria: (name: string) => string;
    increaseHrsAria: (name: string) => string;
    totalDailyLoadLabel: (cityLabel: string) => string;
    seeResultsBtn: string;
  };
  results: {
    backToEditor: string;
    peakSunHoursBadge: (cityLabel: string, hours: number) => string;
    stepBadge: string;
    title: string;
    subtitle: (count: number, cityLabel: string) => string;
    dailyEnergyCardTitle: string;
    kwhPerDayUnit: string;
    whAndMonthlySummary: (wh: number, monthlyKwh: string) => string;
    panelCardTitle: string;
    panelLossAllowanceNote: (lossPct: number, sunHours: number) => string;
    batteryCardTitle: string;
    batteryAutonomyNote: (days: number, dodPct: number) => string;
    costRangeCardTitle: string;
    costRangeCardDesc: (overheadPct: number) => string;
    estimateBadge: string;
    installedCostRangeLabel: string;
    midpointEstimateLabel: string;
    vsGeneratorTitle: string;
    vsGridTitle: string;
    monthlySavingsLabel: string;
    etbPerMonthUnit: string;
    paybackTimeLabel: string;
    monthsAndYearsValue: (months: number, years: string) => string;
    assumptionsAlertTitle: string;
    assumptionsAlertBody: (params: {
      overheadPct: number;
      lossesPct: number;
      dodPct: number;
      gridTariff: number;
      genCost: number;
    }) => string;
    editAssumptionsBtn: string;
    hideAssumptionsBtn: string;
    assumptionFields: {
      panelCost: string;
      batteryCost: string;
      installOverhead: string;
      gridTariff: string;
      generatorFuel: string;
      resetBtn: string;
      defaultLabel: string;
    };
    assumptionMetaLabels: Record<keyof SolarConfig, string>;
    quoteCtaTitle: (cityLabel: string) => string;
    quoteCtaBadge: string;
    quoteCtaDesc: (panelKw: string, batteryKwh: string) => string;
    getQuotesBtn: string;
    quoteFormTitle: string;
    quoteFormDesc: (panelKw: string, batteryKwh: string) => string;
    closeQuoteFormAria: string;
    submitErrorTitle: string;
    supabaseUnconfiguredError: string;
    supabaseInitError: string;
    genericSubmitError: string;
    fullNameLabel: string;
    fullNamePlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    citySelectLabel: string;
    cancelBtn: string;
    submitQuoteBtn: string;
    submittingQuoteBtn: string;
    confirmTitle: string;
    confirmMessage: (params: {
      name: string;
      panelKw: string;
      batteryKwh: string;
      cityLabel: string;
      costLow: string;
      costHigh: string;
      phone: string;
    }) => string;
    doneBtn: string;
    submitAnotherBtn: string;
    includedAppliancesTitle: (count: number) => string;
    includedAppliancesDesc: (dailyKwh: string) => string;
    editListBtn: string;
    hoursPerDayShort: string;
    loadingText: string;
    errorTitle: string;
    errorDesc: string;
    retryBtn: string;
  };
  validation: {
    nameRequired: string;
    nameTooShort: string;
    phoneRequired: string;
    phoneInvalid: string;
    cityRequired: string;
  };
  appliances: Record<ApplianceId, string>;
  cities: Record<EthiopianCity, string>;
}

export const TRANSLATIONS: Record<Language, TranslationDictionary> = {
  am: {
    meta: {
      brandSubtitle: "የኢትዮጵያ የሶላር ማስያ",
      footerText: "SolarGuide ET • ለኢትዮጵያ ተጠቃሚዎች በቀላሉ እና በፍጥነት እንዲሰራ ተደርጎ የተዘጋጀ",
      langToggleLabel: "ቋንቋ ቀይር",
    },
    home: {
      stepBadge: "ደረጃ 1 ከ 2 • የኤሌክትሪክ ፍጆታ እና ከተማ",
      title: "የሶላር ሲስተምዎን በደቂቃዎች ውስጥ ይገምቱ",
      subtitle:
        "ዝግጁ የሆነ የፍጆታ ምርጫ ይምረጡ ወይም የራስዎን የኤሌክትሪክ ዕቃዎች ዝርዝር ያዘጋጁ፣ ከተማዎን ይምረጡ እና የፓነል፣ የባትሪ እና የዋጋ ግምት በብር (ETB) ያግኙ።",
      step1Title: "1. የመነሻ ፍጆታ ዓይነት ይምረጡ",
      step1Desc: "የተለመደ የቤት፣ የሱቅ ወይም የክሊኒክ ፍጆታ ይምረጡ ወይም የራስዎን ዝርዝር ይሙሉ",
      presets: {
        home: {
          name: "መኖሪያ ቤት",
          shortDesc: "አምፖሎች፣ ስልክ፣ ቲቪ እና ፍሪጅ",
        },
        "small-shop": {
          name: "ትንሽ ሱቅ",
          shortDesc: "አምፖሎች፣ ማራገቢያ እና የሱቅ ፍሪዘር",
        },
        clinic: {
          name: "ጤና ኬላ / ክሊኒክ",
          shortDesc: "የክትባት ፍሪጅ፣ አምፖሎች እና ላፕቶፕ",
        },
        custom: {
          name: "የራሴ ዝርዝር",
          shortDesc: "የራስዎን የኤሌክትሪክ ዕቃዎች ይምረጡ",
        },
      },
      step2Title: "2. ከተማዎን ይምረጡ",
      step2Desc: "በአካባቢዎ ያለውን አማካይ የቀን የፀሐይ ሰዓት ለማስላት ይረዳል",
      peakSunHoursBadge: (hours) => `በቀን ${hours} ሰዓት ፀሐይ`,
      cityLabel: "ከተማ / አካባቢ (ኢትዮጵያ)",
      cityOptionLabel: (cityLabel, hours) =>
        `${cityLabel} (በቀን ${hours} የፀሐይ ሰዓት)`,
      step3Title: "3. የኤሌክትሪክ ዕቃዎች ማስተካከያ",
      step3Desc: "ዕቃዎችን ይጨምሩ ወይም ይቀንሱ፣ ብዛት እና በቀን የሚሰሩበትን ሰዓት ያስተካክሉ",
      itemsSummaryBadge: (count, kwh) => `${count} ዕቃዎች • ${kwh} kWh/በቀን`,
      addCommonApplianceLabel: "የተለመዱ የኤሌክትሪክ ዕቃዎችን ይጨምሩ",
      typicalWattsOption: (name, watts) => `${name} (${watts}W አማካይ)`,
      addApplianceBtn: "ዕቃ ጨምር",
      customBtnOpen: "+ ሌላ ዕቃ",
      customBtnCancel: "ሰርዝ",
      customNameLabel: "የዕቃው ስም",
      customNamePlaceholder: "ለምሳሌ፦ የቡና መፍጫ፣ ራውተር",
      customWattsLabel: "ጉልበት (Watts)",
      saveCustomBtn: "ዕቃውን መዝግብ",
      emptyListTitle: "ምንም የኤሌክትሪክ ዕቃ አልተመረጠም",
      emptyListDesc: "ከላይ የኤሌክትሪክ ዕቃ መርጠው «ዕቃ ጨምር» የሚለውን ይጫኑ ወይም የመነሻ ፍጆታ ይምረጡ።",
      wattsEachBadge: (watts) => `እያንዳንዱ ${watts}W`,
      dailyEnergyLabel: "የቀን ፍጆታ፦",
      perDayUnit: "kWh/በቀን",
      quantityLabel: "ብዛት",
      hoursPerDayLabel: "ሰዓት / በቀን",
      removeAriaLabel: (name) => `${name} አስወግድ`,
      decreaseQtyAria: (name) => `የ${name} ብዛት ቀንስ`,
      increaseQtyAria: (name) => `የ${name} ብዛት ጨምር`,
      decreaseHrsAria: (name) => `የ${name} ሰዓት ቀንስ`,
      increaseHrsAria: (name) => `የ${name} ሰዓት ጨምር`,
      totalDailyLoadLabel: (cityLabel) => `ጠቅላላ የቀን ፍጆታ • ${cityLabel}`,
      seeResultsBtn: "የሶላር ውጤት ይመልከቱ",
    },
    results: {
      backToEditor: "ወደ ዕቃዎች ዝርዝር ተመለስ",
      peakSunHoursBadge: (cityLabel, hours) =>
        `${cityLabel} (${hours} የፀሐይ ሰዓት)`,
      stepBadge: "ደረጃ 2 ከ 2 • የሚመከር የሶላር መጠን",
      title: "የሶላር መጠን እና የዋጋ ግምት ውጤት",
      subtitle: (count, cityLabel) =>
        `በ${cityLabel} ለተመረጡ ${count} የኤሌክትሪክ ዕቃ ምድቦች የተሰላ ውጤት።`,
      dailyEnergyCardTitle: "የቀን የኤሌክትሪክ ፍጆታ",
      kwhPerDayUnit: "kWh/በቀን",
      whAndMonthlySummary: (wh, monthlyKwh) =>
        `${wh} Wh/በቀን • ${monthlyKwh} kWh/በወር`,
      panelCardTitle: "የሚመከር የሶላር ፓነል መጠን",
      panelLossAllowanceNote: (lossPct, sunHours) =>
        `የ${lossPct}% የሲስተም ብክነት እና የ${sunHours} ሰዓት ፀሐይን ያካተተ`,
      batteryCardTitle: "የሚመከር የባትሪ መጠን",
      batteryAutonomyNote: (days, dodPct) =>
        `ለ${days} ቀን መጠባበቂያ (በ${dodPct}% የባትሪ አጠቃቀም)`,
      costRangeCardTitle: "የጠቅላላ ሲስተም የዋጋ ግምት (ETB)",
      costRangeCardDesc: (overheadPct) =>
        `የሶላር ፓነል፣ ባትሪ እና የ${overheadPct}% የገጠማ ወጪን ያካትታል`,
      estimateBadge: "ግምታዊ ዋጋ",
      installedCostRangeLabel: "የተገጠመ ሲስተም የዋጋ ክልል ግምት",
      midpointEstimateLabel: "አማካይ ግምት፦",
      vsGeneratorTitle: "ከጀነሬተር ወጪ ጋር ሲነጻጸር",
      vsGridTitle: "ከመብራት ኃይል (EEU) ታሪፍ ጋር ሲነጻጸር",
      monthlySavingsLabel: "ወርሃዊ ቁጠባ፦",
      etbPerMonthUnit: "ብር / በወር",
      paybackTimeLabel: "ወጪውን የሚመልስበት ጊዜ፦",
      monthsAndYearsValue: (months, years) => `${months} ወራት (~${years} ዓመት)`,
      assumptionsAlertTitle:
        "ማሳሰቢያ፦ ዋጋዎች እና ቁጠባዎች በሚስተካከሉ ግምቶች ላይ የተመሰረቱ ናቸው",
      assumptionsAlertBody: ({
        overheadPct,
        lossesPct,
        dodPct,
        gridTariff,
        genCost,
      }) =>
        `የዕቃዎች ዋጋ፣ የገጠማ ወጪ (${overheadPct}%)፣ የሲስተም ብክነት (${lossesPct}%)፣ የባትሪ አጠቃቀም (${dodPct}%)፣ የመብራት ታሪፍ (${gridTariff} ብር/kWh) እና የጀነሬተር ነዳጅ ወጪ (${genCost} ብር/kWh) በ /lib/config.ts ውስጥ የተቀመጡ መነሻ ግምቶች ናቸው። ከታች በመጫን ግምቶቹን ማስተካከል ይችላሉ።`,
      editAssumptionsBtn: "ግምቶችን አስተካክል",
      hideAssumptionsBtn: "ግምቶችን ደብቅ",
      assumptionFields: {
        panelCost: "የፓነል ዋጋ (ብር/kW) [ግምት]",
        batteryCost: "የባትሪ ዋጋ (ብር/kWh) [ግምት]",
        installOverhead: "የገጠማ ወጪ (%) [ግምት]",
        gridTariff: "የመብራት ታሪፍ (ብር/kWh) [ግምት]",
        generatorFuel: "የጀነሬተር ወጪ (ብር/kWh) [ግምት]",
        resetBtn: "ነባሪ ግምቶችን መልስ",
        defaultLabel: "ነባሪ፦",
      },
      assumptionMetaLabels: {
        panelCostPerKwEtb: "የፓነል ዋጋ በkW (ግምት)",
        batteryCostPerKwhEtb: "የባትሪ ዋጋ በkWh (ግምት)",
        installationOverheadPct: "የገጠማ ወጪ % (ግምት)",
        costRangeVariancePct: "የዋጋ ልዩነት % (ግምት)",
        gridTariffPerKwhEtb: "የመብራት ታሪፍ በkWh (ግምት)",
        generatorFuelCostPerKwhEtb: "የጀነሬተር ነዳጅ ወጪ በkWh (ግምት)",
        systemLosses: "የሲስተም ብክነት (ግምት)",
        batteryDepthOfDischarge: "የባትሪ አጠቃቀም DoD (ግምት)",
        batteryAutonomyDays: "የባትሪ መጠባበቂያ ቀናት (ግምት)",
        daysPerMonth: "የወር ቀናት (ግምት)",
      },
      quoteCtaTitle: (cityLabel) =>
        `በ${cityLabel} ከሚገኙ የሶላር አቅራቢዎች ትክክለኛ ዋጋ ማግኘት ይፈልጋሉ?`,
      quoteCtaBadge: "ነፃ የዋጋ ጥያቄ",
      quoteCtaDesc: (panelKw, batteryKwh) =>
        `ለ ${panelKw} kW ፓነል እና ${batteryKwh} kWh ባትሪ ሲስተም ከኢትዮጵያ የሶላር አቅራቢዎች ዋጋ ይጠይቁ።`,
      getQuotesBtn: "ዋጋ ይጠይቁ (Get quotes)",
      quoteFormTitle: "የሶላር አቅራቢዎች የዋጋ ጥያቄ ቅጽ",
      quoteFormDesc: (panelKw, batteryKwh) =>
        `የተሰላው የሲስተም መጠን (${panelKw} kW ፓነል፣ ${batteryKwh} kWh ባትሪ) ከጥያቄዎ ጋር አብሮ ይላካል።`,
      closeQuoteFormAria: "የዋጋ መጠየቂያ ቅጹን ዝጋ",
      submitErrorTitle: "የዋጋ ጥያቄውን መላክ አልተቻለም",
      supabaseUnconfiguredError:
        "የSupabase ግንኙነት ገና አልተሞላም። እባክዎ በ .env.local ውስጥ NEXT_PUBLIC_SUPABASE_URL እና NEXT_PUBLIC_SUPABASE_ANON_KEY ያስገቡ።",
      supabaseInitError: "የSupabase ግንኙነት መጀመር አልተቻለም።",
      genericSubmitError:
        "ጥያቄዎን በማስቀመጥ ላይ ችግር አጋጥሟል። እባክዎ እንደገና ይሞክሩ።",
      fullNameLabel: "ሙሉ ስም *",
      fullNamePlaceholder: "ለምሳሌ፦ አበበ ቢቂላ",
      phoneLabel: "ስልክ ቁጥር *",
      phonePlaceholder: "ለምሳሌ፦ 0911234567 ወይም +251911234567",
      citySelectLabel: "ከተማ *",
      cancelBtn: "ሰርዝ",
      submitQuoteBtn: "የዋጋ ጥያቄ ላክ",
      submittingQuoteBtn: "በመላክ ላይ...",
      confirmTitle: "የዋጋ ጥያቄዎ በተሳካ ሁኔታ ተቀብለናል!",
      confirmMessage: ({
        name,
        panelKw,
        batteryKwh,
        cityLabel,
        costLow,
        costHigh,
        phone,
      }) =>
        `እናመሰግናለን ${name}። በ${cityLabel} ለ ${panelKw} kW ፓነል / ${batteryKwh} kWh ባትሪ ሲስተም (ግምታዊ ዋጋ ${costLow} – ${costHigh} ብር) ያቀረቡት ጥያቄ ተመዝግቧል። የሶላር አቅራቢዎች በስልክ ቁጥር ${phone} ያገኙዎታል።`,
      doneBtn: "ጨርሻለሁ",
      submitAnotherBtn: "ሌላ ጥያቄ ላክ",
      includedAppliancesTitle: (count) => `የተካተቱ የኤሌክትሪክ ዕቃዎች (${count})`,
      includedAppliancesDesc: (dailyKwh) =>
        `የ${dailyKwh} kWh/በቀን ፍጆታ ዝርዝር`,
      editListBtn: "ዝርዝር አስተካክል",
      hoursPerDayShort: "ሰዓት/ቀን",
      loadingText: "የሶላር መጠን እና የዋጋ ግምት በማስላት ላይ...",
      errorTitle: "ችግር አጋጥሟል",
      errorDesc: "ገጹን በመጫን ላይ ስህተት ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።",
      retryBtn: "እንደገና ሞክር",
    },
    validation: {
      nameRequired: "እባክዎ ሙሉ ስምዎን ያስገቡ።",
      nameTooShort: "ስም ቢያንስ 2 ፊደላት መሆን አለበት።",
      phoneRequired: "እባክዎ ስልክ ቁጥርዎን ያስገቡ።",
      phoneInvalid:
        "እባክዎ ትክክለኛ የኢትዮጵያ ስልክ ቁጥር ያስገቡ (ለምሳሌ 0911234567 ወይም +251911234567)።",
      cityRequired: "እባክዎ ከተማ ይምረጡ።",
    },
    appliances: {
      "led-bulb": "ኤልኢዲ አምፖል (LED bulb)",
      "phone-charger": "የስልክ ቻርጀር",
      tv: "ቴሌቪዥን (TV)",
      laptop: "ላፕቶፕ (Laptop)",
      fridge: "ፍሪጅ (ማቀዝቀዣ)",
      fan: "ማራገቢያ (Fan)",
      "water-pump": "የውሃ ፓምፕ",
      "sewing-machine": "የልብስ ስፌት መኪና",
      "shop-freezer": "የሱቅ ፍሪዘር (Deep Freezer)",
      "clinic-vaccine-fridge": "የክሊኒክ የክትባት ፍሪጅ",
    },
    cities: {
      "Addis Ababa": "አዲስ አበባ",
      Gondar: "ጎንደር",
      "Bahir Dar": "ባሕር ዳር",
      Hawassa: "ሀዋሳ",
      Mekelle: "መቐለ",
      "Dire Dawa": "ድሬዳዋ",
      Jimma: "ጅማ",
      Adama: "አዳማ",
    },
  },
  en: {
    meta: {
      brandSubtitle: "Ethiopia Solar Estimator",
      footerText:
        "SolarGuide ET • Designed for fast, low-bandwidth access across Ethiopia",
      langToggleLabel: "Switch language",
    },
    home: {
      stepBadge: "Step 1 of 2 • Load & Location",
      title: "Size your solar system in minutes",
      subtitle:
        "Choose a preset profile or build a custom appliance list, pick your city in Ethiopia, and get instant panel, battery, and ETB cost estimates.",
      step1Title: "1. Choose a Starting Profile",
      step1Desc:
        "Start with a typical Ethiopian load profile or build a custom list",
      presets: {
        home: {
          name: "Home",
          shortDesc: "Lights, phones, TV & fridge",
        },
        "small-shop": {
          name: "Small Shop",
          shortDesc: "Lights, fan & shop freezer",
        },
        clinic: {
          name: "Clinic",
          shortDesc: "Vaccine fridge, lights & laptop",
        },
        custom: {
          name: "Custom List",
          shortDesc: "Build your own appliance list",
        },
      },
      step2Title: "2. Select Your City",
      step2Desc: "Determines average daily peak sun hours for solar sizing",
      peakSunHoursBadge: (hours) => `${hours} peak sun hrs/day`,
      cityLabel: "City / Region in Ethiopia",
      cityOptionLabel: (cityLabel, hours) =>
        `${cityLabel} (${hours} peak sun hours/day)`,
      step3Title: "3. Appliance Editor",
      step3Desc:
        "Add or remove appliances and adjust quantity and hours per day",
      itemsSummaryBadge: (count, kwh) =>
        `${count} ${count === 1 ? "item" : "items"} • ${kwh} kWh/day`,
      addCommonApplianceLabel: "Add a common appliance",
      typicalWattsOption: (name, watts) => `${name} (${watts}W typical)`,
      addApplianceBtn: "Add Appliance",
      customBtnOpen: "+ Custom",
      customBtnCancel: "Cancel",
      customNameLabel: "Appliance Name",
      customNamePlaceholder: "e.g. Coffee grinder, Router",
      customWattsLabel: "Power (Watts)",
      saveCustomBtn: "Save Custom Item",
      emptyListTitle: "No appliances in your list yet",
      emptyListDesc:
        'Select an appliance above and tap "Add Appliance" or pick a preset profile.',
      wattsEachBadge: (watts) => `${watts}W each`,
      dailyEnergyLabel: "Daily energy:",
      perDayUnit: "kWh/day",
      quantityLabel: "Quantity",
      hoursPerDayLabel: "Hours / day",
      removeAriaLabel: (name) => `Remove ${name}`,
      decreaseQtyAria: (name) => `Decrease quantity for ${name}`,
      increaseQtyAria: (name) => `Increase quantity for ${name}`,
      decreaseHrsAria: (name) => `Decrease hours for ${name}`,
      increaseHrsAria: (name) => `Increase hours for ${name}`,
      totalDailyLoadLabel: (cityLabel) => `Total Daily Load • ${cityLabel}`,
      seeResultsBtn: "See Solar Results",
    },
    results: {
      backToEditor: "Back to Appliance Editor",
      peakSunHoursBadge: (cityLabel, hours) =>
        `${cityLabel} (${hours} peak sun hrs)`,
      stepBadge: "Step 2 of 2 • Recommended Solar System",
      title: "Your Solar Sizing & Cost Estimate",
      subtitle: (count, cityLabel) =>
        `Based on ${count} ${count === 1 ? "appliance group" : "appliance groups"} in ${cityLabel}.`,
      dailyEnergyCardTitle: "Daily Energy Use",
      kwhPerDayUnit: "kWh/day",
      whAndMonthlySummary: (wh, monthlyKwh) =>
        `${wh} Wh/day • ${monthlyKwh} kWh/month`,
      panelCardTitle: "Recommended Panel Size",
      panelLossAllowanceNote: (lossPct, sunHours) =>
        `Includes ${lossPct}% system loss allowance at ${sunHours}h sun`,
      batteryCardTitle: "Recommended Battery",
      batteryAutonomyNote: (days, dodPct) =>
        `${days} day autonomy at ${dodPct}% depth of discharge`,
      costRangeCardTitle: "Estimated System Cost Range (ETB)",
      costRangeCardDesc: (overheadPct) =>
        `Includes solar panels, battery storage, and ${overheadPct}% installation overhead`,
      estimateBadge: "Estimate (Assumption)",
      installedCostRangeLabel: "Estimated Installed Cost Range",
      midpointEstimateLabel: "Midpoint estimate:",
      vsGeneratorTitle: "Compared to Backup Generator",
      vsGridTitle: "Compared to Grid Tariff (EEU)",
      monthlySavingsLabel: "Monthly Savings:",
      etbPerMonthUnit: "ETB / mo",
      paybackTimeLabel: "Payback Time:",
      monthsAndYearsValue: (months, years) => `${months} months (~${years} yrs)`,
      assumptionsAlertTitle:
        "Note: Costs & Savings Are Estimates Based on Editable Assumptions",
      assumptionsAlertBody: ({
        overheadPct,
        lossesPct,
        dodPct,
        gridTariff,
        genCost,
      }) =>
        `All equipment prices, installation overhead (${overheadPct}%), system losses (${lossesPct}%), battery depth of discharge (${dodPct}%), grid tariff (${gridTariff} ETB/kWh), and generator fuel cost (${genCost} ETB/kWh) are planning assumptions from /lib/config.ts. You can inspect or edit these assumptions below.`,
      editAssumptionsBtn: "Edit Assumptions",
      hideAssumptionsBtn: "Hide Assumptions",
      assumptionFields: {
        panelCost: "Panel Cost (ETB/kW) [Assumption]",
        batteryCost: "Battery Cost (ETB/kWh) [Assumption]",
        installOverhead: "Install Overhead (%) [Assumption]",
        gridTariff: "Grid Tariff (ETB/kWh) [Assumption]",
        generatorFuel: "Generator Fuel (ETB/kWh) [Assumption]",
        resetBtn: "Reset Default Assumptions",
        defaultLabel: "Default:",
      },
      assumptionMetaLabels: {
        panelCostPerKwEtb: "Panel Cost per kW (Assumption)",
        batteryCostPerKwhEtb: "Battery Cost per kWh (Assumption)",
        installationOverheadPct: "Installation Overhead % (Assumption)",
        costRangeVariancePct: "Cost Variance % (Assumption)",
        gridTariffPerKwhEtb: "Grid Tariff per kWh (Assumption)",
        generatorFuelCostPerKwhEtb: "Generator Fuel Cost per kWh (Assumption)",
        systemLosses: "System Losses (Assumption)",
        batteryDepthOfDischarge: "Battery Depth of Discharge (Assumption)",
        batteryAutonomyDays: "Battery Autonomy (Assumption)",
        daysPerMonth: "Days per Month (Assumption)",
      },
      quoteCtaTitle: (cityLabel) =>
        `Ready for real installer pricing in ${cityLabel}?`,
      quoteCtaBadge: "Free Quote Request",
      quoteCtaDesc: (panelKw, batteryKwh) =>
        `Request quotes from solar installers in Ethiopia for a ${panelKw} kW panel + ${batteryKwh} kWh battery system.`,
      getQuotesBtn: "Get quotes",
      quoteFormTitle: "Request Solar Installer Quotes",
      quoteFormDesc: (panelKw, batteryKwh) =>
        `Your calculated system size (${panelKw} kW panel, ${batteryKwh} kWh battery) will be included automatically.`,
      closeQuoteFormAria: "Close quote form",
      submitErrorTitle: "Could not submit quote request",
      supabaseUnconfiguredError:
        "Supabase is not configured yet. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local and restart the server.",
      supabaseInitError: "Unable to initialize Supabase client.",
      genericSubmitError:
        "Something went wrong while saving your quote request. Please try again.",
      fullNameLabel: "Full Name *",
      fullNamePlaceholder: "e.g. Abebe Bikila",
      phoneLabel: "Phone Number *",
      phonePlaceholder: "e.g. 0911234567 or +251911234567",
      citySelectLabel: "City *",
      cancelBtn: "Cancel",
      submitQuoteBtn: "Submit Quote Request",
      submittingQuoteBtn: "Submitting...",
      confirmTitle: "Quote Request Received!",
      confirmMessage: ({
        name,
        panelKw,
        batteryKwh,
        cityLabel,
        costLow,
        costHigh,
        phone,
      }) =>
        `Thank you, ${name}. Your request for a ${panelKw} kW panel / ${batteryKwh} kWh battery system in ${cityLabel} (estimated ${costLow} – ${costHigh} ETB) has been saved. Installers will contact you at ${phone}.`,
      doneBtn: "Done",
      submitAnotherBtn: "Submit Another Request",
      includedAppliancesTitle: (count) => `Included Appliances (${count})`,
      includedAppliancesDesc: (dailyKwh) =>
        `Breakdown of your ${dailyKwh} kWh/day load`,
      editListBtn: "Edit List",
      hoursPerDayShort: "h/day",
      loadingText: "Calculating solar sizing and ETB cost estimates...",
      errorTitle: "Something went wrong",
      errorDesc: "An unexpected error occurred while loading this page.",
      retryBtn: "Try Again",
    },
    validation: {
      nameRequired: "Please enter your name.",
      nameTooShort: "Name must be at least 2 characters.",
      phoneRequired: "Please enter your phone number.",
      phoneInvalid:
        "Please enter a valid Ethiopian phone number (e.g. 0911234567 or +251911234567).",
      cityRequired: "Please select a city.",
    },
    appliances: {
      "led-bulb": "LED bulb",
      "phone-charger": "Phone charger",
      tv: "TV",
      laptop: "Laptop",
      fridge: "Fridge",
      fan: "Fan",
      "water-pump": "Water pump",
      "sewing-machine": "Sewing machine",
      "shop-freezer": "Shop freezer",
      "clinic-vaccine-fridge": "Clinic vaccine fridge",
    },
    cities: {
      "Addis Ababa": "Addis Ababa",
      Gondar: "Gondar",
      "Bahir Dar": "Bahir Dar",
      Hawassa: "Hawassa",
      Mekelle: "Mekelle",
      "Dire Dawa": "Dire Dawa",
      Jimma: "Jimma",
      Adama: "Adama",
    },
  },
};

const ENGLISH_NAME_TO_APPLIANCE_ID: Record<string, ApplianceId> = {
  "led bulb": "led-bulb",
  "phone charger": "phone-charger",
  tv: "tv",
  laptop: "laptop",
  fridge: "fridge",
  fan: "fan",
  "water pump": "water-pump",
  "sewing machine": "sewing-machine",
  "shop freezer": "shop-freezer",
  "clinic vaccine fridge": "clinic-vaccine-fridge",
};

/**
 * Returns the localized appliance name if it matches one of the 10 standard presets,
 * or returns the custom name as-is.
 */
export function translateApplianceName(name: string, lang: Language): string {
  const key = ENGLISH_NAME_TO_APPLIANCE_ID[name.trim().toLowerCase()];
  if (key) {
    return TRANSLATIONS[lang].appliances[key];
  }
  return name;
}

export function translateCityName(city: EthiopianCity, lang: Language): string {
  return TRANSLATIONS[lang].cities[city] ?? city;
}
