const decimalFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// A digitação usa centavos: 3500 vira 35,00, sem arredondar durante a edição.
export function formatCurrencyInput(value: string): string {
  if (value.includes("-")) return "";

  const digits = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  if (!digits) return "";

  const padded = digits.padStart(3, "0");
  const whole = padded.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${whole},${padded.slice(-2)}`;
}

export function parseCurrencyInput(value: string): number {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return Number.NaN;

  const amount = Number(normalized);
  if (!Number.isSafeInteger(Math.round(amount * 100))) return Number.NaN;
  return amount;
}

export function currencyToInput(value?: string | number | null): string {
  if (value === undefined || value === null || value === "") return "";

  const amount = typeof value === "string" && value.includes(",")
    ? parseCurrencyInput(value)
    : Number(value);

  if (!Number.isFinite(amount) || amount < 0) return "";
  return decimalFormatter.format(amount);
}
