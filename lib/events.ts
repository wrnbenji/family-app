import { supabase } from './supabase';

export type EventRow = {
  id: string;
  household_id: string;
  title: string;
  starts_at: string;   // ISO
  ends_at: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
};

export async function fetchEvents(householdId: string): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('household_id', householdId)
    .order('starts_at', { ascending: true });
  if (error) throw error;
  return (data as EventRow[]) ?? [];
}

export async function createEvent(
  householdId: string,
  title: string,
  startsISO: string,
  endsISO: string | null,
  notes?: string | null
) {
  const { data: user } = await supabase.auth.getUser();
  const created_by = user.user?.id;
  if (!created_by) throw new Error('Not signed in');
  const payload = { household_id: householdId, title, starts_at: startsISO, ends_at: endsISO, notes: notes ?? null, created_by };
  const { error } = await supabase.from('events').insert(payload);
  if (error) throw error;
}

export async function updateEvent(id: string, patch: Partial<Pick<EventRow,'title'|'starts_at'|'ends_at'|'notes'>>) {
  const { error } = await supabase.from('events').update(patch).eq('id', id);
  if (error) throw error;
}

export async function removeEvent(id: string) {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}
