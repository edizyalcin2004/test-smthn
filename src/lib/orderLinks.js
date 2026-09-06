const hosts = new Set(['www.yemeksepeti.com', 'tgoyemek.com', 'getir.com',
  'www.migros.com.tr', 'www.tiklagelsin.com', 'siparis.mcdonalds.com.tr']);
export function safeOrderURL(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && hosts.has(url.hostname) &&
      !url.username && !url.password && !url.port ? url.href : null;
  } catch { return null; }
}
export async function openOrderLink(value, openURL) {
  const url = safeOrderURL(value);
  if (!url) return false;
  try { await openURL(url); return true; } catch { return false; }
}
