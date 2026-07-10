export function formatBytes(raw: string): string {
  const bytes = Number(raw);
  if (!Number.isFinite(bytes) || bytes === 0) return raw;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

export const toNumber = (v: string | null, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
