/**
 * Formatea un monto en euros (EUR) con locale español.
 * Ej: 1234.5 → "1.234,50 €"
 */
export function formatMoney(amount, options = {}) {
  const value = Number(amount);
  const safe = Number.isFinite(value) ? value : 0;
  const digits = options.fractionDigits ?? 2;

  return safe.toLocaleString('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** Símbolo de moneda para campos de entrada */
export const CURRENCY_SYMBOL = '€';
