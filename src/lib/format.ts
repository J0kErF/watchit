export function formatDuration(seconds?: number) {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

/** Archive runtimes come as "1:17:26", "20:33" or "92 min". */
export function formatRuntime(runtime?: string) {
  if (!runtime) return "";
  if (/^\d+(:\d{1,2}){1,2}$/.test(runtime)) {
    return formatDuration(runtime.split(":").reduce((acc, p) => acc * 60 + Number(p), 0));
  }
  return runtime;
}
