// On-device order history (D-030). Nothing leaves the phone: no account,
// no identifiers. A "pending" handoff is written right before we open the
// platform; the return popup turns it into a confirmed order or drops it.
import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING = 'pryce.pendingOrder.v1';
const ORDERS = 'pryce.orders.v1';

async function read(key, fallback) {
  try { const v = await AsyncStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}

export const loadPending = () => read(PENDING, null);
export const savePending = (p) => AsyncStorage.setItem(PENDING, JSON.stringify(p));
export const clearPending = () => AsyncStorage.removeItem(PENDING);
export const loadOrders = () => read(ORDERS, []);

export async function confirmOrder(pending, { accurate }) {
  const orders = await loadOrders();
  if (!orders.some((o) => o.id === pending.id)) {
    orders.push({ ...pending, confirmedAt: Date.now(), accurate: accurate ? true : null });
    await AsyncStorage.setItem(ORDERS, JSON.stringify(orders));
  }
  await clearPending();
}
