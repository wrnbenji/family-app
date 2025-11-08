import { supabase } from './supabase';

export type Household = { id: string; name: string };

type MembershipRow = {
  household_id: string;
  role: 'admin' | 'parent' | 'child';
  households: Household | null; // join
};

async function getUserId(): Promise<string | undefined> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id;
}

export async function listMyHouseholds(): Promise<Household[]> {
  const uid = await getUserId();
  if (!uid) return [];

  const { data, error } = await supabase
    .from('memberships')
    .select('household_id, role, households:household_id(id,name)')
    .eq('user_id', uid);

  if (error) throw error;

  const rows = (data as MembershipRow[] | null) ?? [];
  return rows
    .map((r) => r.households)
    .filter((h): h is Household => h != null);
}

export async function createHousehold(name: string): Promise<Household> {
  const uid = await getUserId();
  if (!uid) throw new Error('Not signed in');
  const { data, error } = await supabase
    .from('households')
    .insert({ name, created_by: uid })
    .select('*')
    .single();
  if (error) throw error;
  return data as Household;
}

function randomCode(len = 8) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // nincs 0,O,1,I
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export async function createInvite(householdId: string): Promise<string> {
  const uid = await getUserId();
  if (!uid) throw new Error('Not signed in');
  const code = randomCode(8);
  const { error } = await supabase
    .from('invites')
    .insert({ household_id: householdId, code, created_by: uid });
  if (error) throw error;
  return code;
}

export async function acceptInvite(code: string): Promise<string> {
  const { data, error } = await supabase.rpc('accept_invite', { p_code: code });
  if (error) throw error;
  return data as string; // household_id
}
