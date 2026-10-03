// Only https links to the delivery platforms we compare; anything else from
// the API is ignored rather than opened (D-030).
const HOSTS = new Set(['tgoyemek.com', 'www.yemeksepeti.com', 'www.migros.com.tr',
  'www.tiklagelsin.com', 'siparis.mcdonalds.com.tr']);

export function safeOrderURL(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && HOSTS.has(u.hostname) && !u.username && !u.password && !u.port
      ? u.href : null;
  } catch { return null; }
}
