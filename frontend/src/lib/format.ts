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

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
