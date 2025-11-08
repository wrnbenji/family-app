import { supabase } from './supabase';

export type Role = 'admin' | 'parent' | 'child' | null;

export async function getMyRole(householdId: string): Promise<Role> {
  const { data, error } = await supabase.rpc('role_for', { p_household: householdId });
  if (error) throw error;
  return (data as string | null) as Role;
}

export function flags(role: Role) {
  return {
    isAdmin: role === 'admin',
    isParentOrAdmin: role === 'admin' || role === 'parent',
    isChild: role === 'child',
  };
}
