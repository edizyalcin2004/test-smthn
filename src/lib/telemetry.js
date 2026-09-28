// Anonymous usage telemetry (T-027). Nothing here identifies a person:
// no account, no device/advertising id, no location. A random session id
// lives only while the app is open; a random compare id ties one
// comparison to its handoff and return answer. "First compare this week"
// and "days since first use" are computed ON THE PHONE and only the flag /
// bucket is sent.
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { postEvents } from '../api/client';
import appJson from '../../app.json';

export const randomId = (n = 16) =>
  Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('');

const SESSION_ID = randomId(32);
const FIRST_USE = 'pryce.firstUse.v1';
const LAST_WEEK = 'pryce.lastCompareWeek.v1';
const DAY = 864e5;

export function weekKey(t) {           // ISO-ish week: Monday-based, local time
  const d = new Date(t); d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}
export function daysBucket(firstUse, now) {
  const days = Math.floor((now - firstUse) / DAY);
  return days <= 0 ? '0' : days <= 7 ? '1-7' : days <= 14 ? '8-14' : days <= 30 ? '15-30' : '30+';
}

async function firstUse(now) {
  try {
    const v = await AsyncStorage.getItem(FIRST_USE);
    if (v) return Number(v);
    await AsyncStorage.setItem(FIRST_USE, String(now));
  } catch {}
  return now;
}

const base = () => ({
  app_version: String(appJson?.expo?.version ?? '').slice(0, 16) || undefined,
  os: ['ios', 'android', 'web'].includes(Platform.OS) ? Platform.OS : undefined,
});

export async function clientContext() {
  const now = Date.now();
  return { ...base(), days_bucket: daysBucket(await firstUse(now), now) };
}

// Called once per comparison: also answers "is this the first compare this week?"
export async function compareContext() {
  const now = Date.now();
  const wk = weekKey(now);
  let first = true;
  try {
    first = (await AsyncStorage.getItem(LAST_WEEK)) !== wk;
    if (first) await AsyncStorage.setItem(LAST_WEEK, wk);
  } catch {}
  return { ...base(), days_bucket: daysBucket(await firstUse(now), now), first_compare_this_week: first };
}

let queue = [];
let timer = null;
export function track(event) {
  queue.push(event);
  if (queue.length >= 20) return flush();
  if (!timer) timer = setTimeout(flush, 2000);
}
export async function flush() {
  clearTimeout(timer); timer = null;
  const events = queue.splice(0, 50);
  if (!events.length) return;
  try { await postEvents({ session_id: SESSION_ID, client: await clientContext(), events }); }
  catch { /* telemetry must never bother the user */ }
}
