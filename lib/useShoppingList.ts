import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './supabase';
import { v4 as uuid } from 'uuid';

type Item = { id: string; title: string; qty?: string; checked: boolean; clientTag?: string; updatedAt: number };
type StoreState = {
  items: Record<string, Item>;
  pending: string[];
  householdId?: string;
  setHousehold: (id: string) => void;
  add: (title: string, qty?: string) => void;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  replaceAll: (list: Item[]) => void;
  markSynced: (ids: string[]) => void;
};

export const useShoppingStore = create<StoreState>()(persist((set, get) => ({
  items: {}, pending: [], householdId: undefined,
  setHousehold: (id) => set({ householdId: id }),
  add: (title, qty) => {
    const id = uuid(); const now = Date.now();
    const it: Item = { id, title, qty, checked: false, clientTag: `local:${id}`, updatedAt: now };
    set(s => ({ items: { ...s.items, [id]: it }, pending: [...s.pending, id] }));
  },
  toggle: (id) => set(s => {
    const it = s.items[id]; if (!it) return s;
    const upd = { ...it, checked: !it.checked, updatedAt: Date.now() };
    return { items: { ...s.items, [id]: upd }, pending: [...new Set([...s.pending, id])] };
  }),
  remove: (id) => set(s => {
    const copy = { ...s.items }; delete copy[id];
    return { items: copy, pending: [...new Set([...s.pending, id])] };
  }),
  replaceAll: (list) => set({ items: Object.fromEntries(list.map(x => [x.id, x])) }),
  markSynced: (ids) => set(s => ({ pending: s.pending.filter(id => !ids.includes(id)) })),
}), { name: 'shopping-store' }));

export async function syncWithServer() {
  const state = useShoppingStore.getState();
  if (!state.householdId) return;

  // 1) upsert pending
  const toSyncIds = [...state.pending];
  if (toSyncIds.length) {
    const upserts = toSyncIds
      .map(id => state.items[id])
      .filter(Boolean)
      .map(x => ({
        id: x!.id, title: x!.title, qty: x!.qty, checked: x!.checked,
        household_id: state.householdId, client_tag: x!.clientTag, updated_at: new Date(x!.updatedAt).toISOString()
      }));
    if (upserts.length) {
      await supabase.from('shopping_items').upsert(upserts, { onConflict: 'id' });
    }
    useShoppingStore.getState().markSynced(toSyncIds);
  }

  // 2) pull latest
  const { data } = await supabase
    .from('shopping_items')
    .select('id,title,qty,checked,updated_at')
    .eq('household_id', state.householdId);

  if (data) {
    const merged = data.map(d => ({
      id: d.id, title: d.title, qty: d.qty ?? undefined,
      checked: d.checked, updatedAt: new Date(d.updated_at as string).getTime()
    }));
    useShoppingStore.getState().replaceAll(merged);
  }
}

// realtime
supabase
  .channel('shopping-ch')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_items' }, () => syncWithServer())
  .subscribe();