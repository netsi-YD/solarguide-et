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

export function validateQuoteForm(input: QuoteFormInput): QuoteValidationResult {
  const name = input.name.trim();
  const phone = input.phone.trim();
  const city = input.city.trim();

  const errors: QuoteValidationResult["errors"] = {};

  if (!name) {
    errors.name = "Please enter your name.";
  } else if (name.length < 2) {
    errors.name = "Name must be at least 2 characters.";
  }

  if (!phone) {
    errors.phone = "Please enter your phone number.";
  } else if (!isValidPhoneNumber(phone)) {
    errors.phone =
      "Please enter a valid Ethiopian phone number (e.g. 0911234567 or +251911234567).";
  }

  if (!city) {
    errors.city = "Please select a city.";
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
