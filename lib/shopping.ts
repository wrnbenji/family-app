import { supabase } from './supabase';

function isPermErr(e: any) {
  const msg = String(e?.message || '');
  return e?.code === 'PGRST301' || /permission|rls|row level/i.test(msg);
}

/** Elem létrehozása / frissítése (példa: name, done, created_by stb.) */
export async function upsertShoppingItem(payload: {
  id?: string;
  household_id: string;
  name: string;
  done?: boolean;
  created_by?: string; // opcionális, RLS default is lehet
}) {
  try {
    const { error } = await supabase.from('shopping_items').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (e: any) {
    if (isPermErr(e)) {
      console.warn('Nincs jogosultság a bevásárlólista módosítására.', e);
      return false;
    }
    throw e;
  }
}

/** Készre jelölés / visszavonás */
export async function setShoppingDone(id: string, done: boolean) {
  try {
    const { error } = await supabase.from('shopping_items').update({ done }).eq('id', id);
    if (error) throw error;
    return true;
  } catch (e: any) {
    if (isPermErr(e)) {
      console.warn('Nincs jogosultság a bevásárlólista módosítására.', e);
      return false;
    }
    throw e;
  }
}

/** Törlés */
export async function removeShoppingItem(id: string) {
  try {
    const { error } = await supabase.from('shopping_items').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (e: any) {
    if (isPermErr(e)) {
      console.warn('Nincs jogosultság a bevásárlólista törlésére.', e);
      return false;
    }
    throw e;
  }
}
