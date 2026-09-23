/** 42 → "00:42"; 3725 → "62:05". */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** 38.4 → "38s"; 92 → "1min 32s"; 120 → "2min". */
export function formatSeconds(value: number): string {
  const total = Math.max(0, Math.round(value));
  if (total < 60) return `${total}s`;
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return seconds === 0 ? `${minutes}min` : `${minutes}min ${seconds}s`;
}

/** 0 → "A", 2 → "C". */
export function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? "";
}

/** As iniciais do avatar: primeira e última palavra do nome ("Sávio Santos Rocha" → "SR"). */
export function initials(fullName: string): string {
  const partes = fullName.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";

  return (primeira + ultima).toUpperCase();
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** 1240 → "1.240" (padrão brasileiro). */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

/** "2026-09-19" → "S" (inicial do dia da semana, em português). */
export function weekdayInitial(isoDate: string): string {
  const initials = ["D", "S", "T", "Q", "Q", "S", "S"];
  // meio-dia UTC evita virar o dia por causa de fuso
  return initials[new Date(`${isoDate}T12:00:00Z`).getUTCDay()];
}
