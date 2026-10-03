// On-device order history (D-030). Confirmation sends the limited order
// summary below; the full history stays local. A pending handoff precedes the
// platform; the return popup turns it into a confirmed order or drops it.
import { confirmedAmounts } from './savings';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { postOrderFeedback } from '../api/client';

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

// matched: true "prices matched", false "prices were different", null unanswered.
// reason (only when matched === false): item_price | fee | code | unavailable | other
export async function confirmOrder(pending, { matched, reason, paid }) {
  const confirmed = confirmedAmounts(pending, paid, matched);
  const orders = await loadOrders();
  if (!orders.some((o) => o.id === pending.id)) {
    orders.push({ ...confirmed, confirmedAt: Date.now(), matched: matched ?? null });
    await AsyncStorage.setItem(ORDERS, JSON.stringify(orders));
    postOrderFeedback({
      compare_id: pending.compareId ?? null,
      restaurant_id: pending.restaurant.id, platform_id: pending.platform.id, ordered: true,
      items: pending.items, paid: confirmed.paid, prices_matched: matched ?? null,
      mismatch_reason: matched === false ? (reason ?? null) : null,
    }).catch(() => {});
  }
  await clearPending();
}

// "Hayır": nothing is kept on the phone; the server only learns that this
// comparison's handoff did not become an order (no basket, no price).
export async function declineOrder(pending) {
  postOrderFeedback({
    compare_id: pending.compareId ?? null, restaurant_id: pending.restaurant.id,
    platform_id: pending.platform.id, ordered: false,
  }).catch(() => {});
  await clearPending();
}
