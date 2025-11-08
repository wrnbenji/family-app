import { supabase } from './supabase';

export type TaskRow = {
  id: string;
  household_id: string;
  title: string;
  description?: string | null;
  assignee?: string | null;      // user_id (egyelőre)
  due_at?: string | null;        // ISO string
  done: boolean;
  created_by: string;
  created_at: string;
  updated_at?: string | null;
};

// Bejelentkezett user ID
export async function getUid(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user?.id) throw new Error('Not signed in');
  return data.user.id;
}

// Lista betöltése
export async function fetchTasks(householdId: string): Promise<TaskRow[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('household_id', householdId)
    .order('done', { ascending: true })
    .order('due_at', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as TaskRow[]) ?? [];
}

// Létrehozás
export async function createTask(
  householdId: string,
  title: string,
  opts?: { due?: string | null; assignToSelf?: boolean }
) {
  const uid = await getUid();
  const payload: Partial<TaskRow> = {
    household_id: householdId,
    title,
    due_at: opts?.due ?? null,
    assignee: opts?.assignToSelf ? uid : null,
    done: false,
    created_by: uid,
  };
  const { error } = await supabase.from('tasks').insert(payload);
  if (error) throw error;
}

// Készre jelölés / visszavonás
export async function setDone(id: string, done: boolean) {
  const { error } = await supabase.from('tasks').update({ done }).eq('id', id);
  if (error) throw error;
}

// Törlés
export async function removeTask(id: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}
