import { supabase } from './supabase';

export type Member = { user_id: string; email: string; role: 'admin' | 'parent' | 'child' };

export async function listMembers(householdId: string): Promise<Member[]> {
  const { data, error } = await supabase.rpc('list_members', { p_household: householdId });
  if (error) throw error;
  return (data as Member[]) ?? [];
}

export async function setMemberRole(householdId: string, userId: string, role: Member['role']) {
  const { error } = await supabase.rpc('set_member_role', {
    p_household: householdId,
    p_user: userId,
    p_role: role,
  });
  if (error) throw error;
}

export async function leaveHousehold(householdId: string) {
  const { data } = await supabase.auth.getUser();
  const me = data.user?.id;
  if (!me) throw new Error('Not signed in');
  const { error } = await supabase
    .from('memberships')
    .delete()
    .eq('household_id', householdId)
    .eq('user_id', me);
  if (error) throw error;
}
