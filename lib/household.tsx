import { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, Pressable } from 'react-native';
import { useAppState } from '../lib/useAppState';
import { listMyHouseholds, createHousehold, createInvite, acceptInvite, Household } from '../lib/households';

export default function HouseholdScreen() {
  const { householdId, setHouseholdId } = useAppState();
  const [list, setList] = useState<Household[]>([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [inviteFor, setInviteFor] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  async function refresh() {
    const rows = await listMyHouseholds();
    setList(rows);
  }
  useEffect(() => { refresh(); }, []);

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
            <Button title="Meghívó kód" onPress={() => onInvite(h.id)} />
          </View>
        </Pressable>
      ))}

      {!!inviteFor && !!inviteCode && (
        <View style={{ padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8 }}>
          <Text style={{ fontWeight: '600' }}>Meghívó kód:</Text>
          <Text style={{ fontSize: 24, letterSpacing: 2, marginVertical: 8 }}>{inviteCode}</Text>
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
    </ScrollView>
  );
}
