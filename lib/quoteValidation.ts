import { TRANSLATIONS, type Language } from "./translations.ts";

export interface QuoteFormInput {
  name: string;
  phone: string;
  city: string;
}

export interface QuoteValidationResult {
  valid: boolean;
  errors: {
    name?: string;
    phone?: string;
    city?: string;
  };
  sanitized: {
    name: string;
    phone: string;
    city: string;
  };
}

/**
 * Checks whether a phone string looks like a valid Ethiopian or international phone number.
 * Accepts common Ethiopian formats:
 * - 09XXXXXXXX or 07XXXXXXXX (10 digits)
 * - +2519XXXXXXXX or +2517XXXXXXXX
 * - 2519XXXXXXXX or 2517XXXXXXXX
 * As well as standard 9-15 digit phone numbers with optional spaces, dashes, or parentheses.
 */
export function isValidPhoneNumber(rawPhone: string): boolean {
  const trimmed = rawPhone.trim();
  if (!trimmed) return false;

  // Strip spaces, hyphens, parentheses, and dots
  const compact = trimmed.replace(/[\s\-().]/g, "");

  // Check Ethiopian mobile / landline pattern or general international 9-15 digit number
  const ethiopianPattern = /^(?:\+?251|0)[1-9]\d{8}$/;
  const internationalPattern = /^\+?[1-9]\d{8,14}$/;

  return ethiopianPattern.test(compact) || internationalPattern.test(compact);
}

export function validateQuoteForm(
  input: QuoteFormInput,
  lang: Language = "en"
): QuoteValidationResult {
  const name = input.name.trim();
  const phone = input.phone.trim();
  const city = input.city.trim();

  const messages = TRANSLATIONS[lang].validation;
  const errors: QuoteValidationResult["errors"] = {};

  if (!name) {
    errors.name = messages.nameRequired;
  } else if (name.length < 2) {
    errors.name = messages.nameTooShort;
  }

  if (!phone) {
    errors.phone = messages.phoneRequired;
  } else if (!isValidPhoneNumber(phone)) {
    errors.phone = messages.phoneInvalid;
  }

  if (!city) {
    errors.city = messages.cityRequired;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      name,
      phone,
      city,
    },
  };
}
