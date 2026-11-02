/**
 * Build the international number the SMS gateways accept (+<country><number>).
 * People type numbers the way they know them: "0664 123 4567", "0664/123-4567",
 * "+43 664 …" or "0043 664 …". Both gateways reject a trunk zero after the
 * country code (+430664…), so it is dropped here.
 */
export function toE164(dialCode: string, input: string): string {
  const raw = input.trim();
  const digits = raw.replace(/\D/g, '');
  const cc = dialCode.replace(/\D/g, '');
  // The store-review test number is all zeros — keep it exactly as typed.
  if (!/[1-9]/.test(digits)) return `+${cc}${digits}`;
  // Typed the full international number themselves.
  if (raw.startsWith('+')) return `+${digits}`;
  if (digits.startsWith('00')) return `+${digits.slice(2)}`;
  return `+${cc}${digits.replace(/^0+/, '')}`;
}
