import { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, Pressable } from 'react-native';
import { useAppState } from '../lib/useAppState';
import { listMyHouseholds, createHousehold, createInvite, acceptInvite, Household } from '../lib/households';
import { listMembers, setMemberRole, leaveHousehold, Member } from '../lib/members';
import { supabase } from '../lib/supabase';
import * as Clipboard from 'expo-clipboard'; // ha szeretnél "másolás" gombot

export default function HouseholdScreen() {
  const { householdId, setHouseholdId } = useAppState();
  const [list, setList] = useState<Household[]>([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [inviteFor, setInviteFor] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [amAdmin, setAmAdmin] = useState(false);

  async function refresh() {
    const rows = await listMyHouseholds();
    setList(rows);
  }
  useEffect(() => { refresh(); }, []);

  async function refreshMembers(hid: string) {
    const rows = await listMembers(hid);
    setMembers(rows);
    const { data } = await supabase.auth.getUser();
    const me = data.user?.id;
    setAmAdmin(!!rows.find(r => r.user_id === me && r.role === 'admin'));
  }

  // háztartás váltáskor taglista + meghívó UI reset
  useEffect(() => {
    if (householdId) {
      refreshMembers(householdId);
      if (inviteFor !== householdId) { setInviteFor(null); setInviteCode(null); }
    }
  }, [householdId]);

  async function onCreate() {
    if (!name.trim()) return;
    await createHousehold(name.trim());
    setName('');
    await refresh();
  }

  async function onInvite(hid: string) {
    setInviteFor(hid);
    const code = await createInvite(hid);
    setInviteCode(code);
  }

  async function onJoin() {
    if (!code.trim()) return;
    try {
      const hid = await acceptInvite(code.trim());
      setHouseholdId(hid);
      setCode('');
      await refresh();
      alert('Csatlakoztál!');
    } catch (e: any) {
      alert(e.message || 'Hibás vagy lejárt kód.');
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '600' }}>Háztartások</Text>

      {list.length === 0 && <Text>Még nincs háztartásod. Hozz létre egyet, vagy csatlakozz kóddal.</Text>}

      {list.map(h => (
        <Pressable key={h.id} onPress={() => setHouseholdId(h.id)}
          style={{ padding: 12, borderWidth: 1, borderColor: householdId === h.id ? '#333' : '#ccc', borderRadius: 8 }}>
          <Text style={{ fontWeight: '600' }}>{h.name}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <Button title="Kiválaszt" onPress={() => setHouseholdId(h.id)} />
            <Button title="Meghívó kód" onPress={() => onInvite(h.id)} disabled={!amAdmin} />

          </View>
        </Pressable>
      ))}

      {!!inviteFor && !!inviteCode && (
        <View style={{ padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8 }}>
          <Text style={{ fontWeight: '600' }}>Meghívó kód:</Text>
          <Text style={{ fontSize: 24, letterSpacing: 2, marginVertical: 8 }}>{inviteCode}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
          <Button title="Kód másolása"onPress={() => { Clipboard.setStringAsync(inviteCode!); alert('Kimásolva!'); }}/>

          </View>
          <Text>Oszd meg a kódot a családtagokkal – ezzel csatlakozhatnak.</Text>
        </View>
      )}

      <View style={{ padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8 }}>
        <Text style={{ fontWeight: '600', marginBottom: 8 }}>Új háztartás</Text>
        <TextInput placeholder="Név..." value={name} onChangeText={setName}
          style={{ borderWidth: 1, padding: 8, marginBottom: 8 }} />
        <Button title="Létrehozás" onPress={onCreate} />
      </View>

      <View style={{ padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8 }}>
        <Text style={{ fontWeight: '600', marginBottom: 8 }}>Csatlakozás kóddal</Text>
        <TextInput placeholder="Kód (pl. 8 karakter)" value={code} onChangeText={setCode}
          style={{ borderWidth: 1, padding: 8, marginBottom: 8 }} />
        <Button title="Csatlakozás" onPress={onJoin} />
      </View>

      <Text style={{ marginTop: 4 }}>Kiválasztott háztartás: {householdId ?? 'nincs'}</Text>

      {/* TAGOK + SZEREPKÖRÖK */}
      {householdId && (
        <View style={{ padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, gap: 8 }}>
          <Text style={{ fontWeight: '600', fontSize: 16 }}>Tagok</Text>

          {members.length === 0 ? (
            <Text>—</Text>
          ) : (
            members.map(m => (
              <View key={m.user_id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                <View>
                  <Text>{m.email}</Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>Szerep: {m.role}</Text>
                </View>

                {amAdmin && (
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <Button title="Admin" onPress={async () => { await setMemberRole(householdId, m.user_id, 'admin'); await refreshMembers(householdId); }} />
                    <Button title="Szülő" onPress={async () => { await setMemberRole(householdId, m.user_id, 'parent'); await refreshMembers(householdId); }} />
                    <Button title="Gyerek" onPress={async () => { await setMemberRole(householdId, m.user_id, 'child'); await refreshMembers(householdId); }} />
                  </View>
                )}
              </View>
            ))
          )}

          <View style={{ height: 8 }} />
          <Button title="Kilépés a háztartásból" onPress={async () => {
            await leaveHousehold(householdId);
            setHouseholdId(undefined);
            setMembers([]);
          }} />
        </View>
      )}
    </ScrollView>
  );
}
