// Single source of truth for the storefront WhatsApp contact.
//
// Pakistani numbers are stored locally as 03xx-xxxxxxx but wa.me links
// require the international format with no leading zero, no spaces,
// and no `+`. Keeping this in one place means we never ship a malformed
// link from a copy-paste error in a component.

export const WHATSAPP_NUMBER_DISPLAY = '0349 3659078';
// `923` = Pakistan country code (92) + the number's first digit.
export const WHATSAPP_NUMBER_E164 = '923493659078';

// Build a wa.me URL with a pre-filled message. Empty/undefined messages
// just open a normal chat.
export const buildWhatsAppUrl = (message = '') => {
  const base = `https://wa.me/${WHATSAPP_NUMBER_E164}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
};

// Normalize a free-form Pakistani phone number into the E.164 format
// that wa.me expects (digits only, no `+`, country code prefix). Handles
// the common shapes admins type into the order form:
//
//   "0349 3659078"  → "923493659078"
//   "+92 349 3659078" → "923493659078"
//   "923493659078"  → "923493659078"
//   "349-3659078"   → "923493659078"  (assumed local — prepends country code)
//
// Returns null when the input doesn't look like a valid PK mobile so the
// caller can disable the button rather than open a broken wa.me link.
export const normalizePkPhoneToE164 = (raw) => {
  if (!raw) return null;
  const digits = String(raw).replace(/\D+/g, '');
  if (!digits) return null;

  // Already +92… → strip the leading 0/00 and pass through.
  if (digits.startsWith('92') && digits.length >= 11 && digits.length <= 13) {
    return digits.slice(0, 12); // 92 + 10 digits = 12 total
  }
  // Local 03xxxxxxxxx → 923xxxxxxxxx
  if (digits.startsWith('0') && digits.length === 11) {
    return `92${digits.slice(1)}`;
  }
  // Bare 3xxxxxxxxx → assume PK mobile, prepend country code.
  if (digits.length === 10 && digits.startsWith('3')) {
    return `92${digits}`;
  }
  return null;
};

// Build a wa.me URL targeted at a specific recipient (instead of the
// brand inbox). Falls back to null when the phone can't be normalized
// — caller is expected to gate UI on the result.
export const buildCustomerWhatsAppUrl = (rawPhone, message = '') => {
  const e164 = normalizePkPhoneToE164(rawPhone);
  if (!e164) return null;
  const base = `https://wa.me/${e164}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
};
