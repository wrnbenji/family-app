import { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, ScrollView } from 'react-native';
import { useAppState } from '../lib/useAppState';
import { fetchEvents, createEvent, removeEvent, EventRow } from '../lib/events';
import { supabase } from '../lib/supabase';
import { getMyRole, flags, type Role } from '../lib/roles';

export default function CalendarScreen() {
  const { householdId } = useAppState();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');   // YYYY-MM-DD
  const [start, setStart] = useState(''); // HH:MM
  const [end, setEnd] = useState('');     // HH:MM
  const [notes, setNotes] = useState('');

  const [myRole, setMyRole] = useState<Role>(null);
  const f = flags(myRole);

  if (!householdId) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text>Nincs kiválasztott háztartás. Menj a Háztartás fülre és válassz egyet.</Text>
      </ScrollView>
    );
  }

  const hid: string = householdId;

  async function load() {
    const list = await fetchEvents(hid);
    setEvents(list);
  }

  useEffect(() => {
    (async () => {
      const r = await getMyRole(hid);
      setMyRole(r);
    })();
  }, [hid]);

  useEffect(() => { load(); }, [hid]);

  useEffect(() => {
    const ch = supabase
      .channel(`events-${hid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [hid]);

  async function onAdd() {
    if (!f.isParentOrAdmin) {
      alert('Csak szülő vagy admin hozhat létre eseményt.');
      return;
    }
    const t = title.trim();
    if (!t || !date || !start) return;
    const startsISO = `${date}T${start}:00.000Z`;
    const endsISO = end ? `${date}T${end}:00.000Z` : null;
    await createEvent(hid, t, startsISO, endsISO, notes.trim() || null);
    setTitle(''); setDate(''); setStart(''); setEnd(''); setNotes('');
  }

  const fmt = (dt?: string | null) => (dt ? dt.slice(0,16).replace('T',' ') : '-');

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '600' }}>Naptár</Text>

      {/* Új esemény – csak szülő/admin */}
      {f.isParentOrAdmin && (
        <View style={{ gap: 8, padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8 }}>
          <Text style={{ fontWeight: '600' }}>Új esemény</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="Cím" style={{ borderWidth: 1, padding: 8 }} />
          <TextInput value={date} onChangeText={setDate} placeholder="Dátum (YYYY-MM-DD)" style={{ borderWidth: 1, padding: 8 }} />
          <TextInput value={start} onChangeText={setStart} placeholder="Kezdés (HH:MM)" style={{ borderWidth: 1, padding: 8 }} />
          <TextInput value={end} onChangeText={setEnd} placeholder="Vég (HH:MM) – opcionális" style={{ borderWidth: 1, padding: 8 }} />
          <TextInput value={notes} onChangeText={setNotes} placeholder="Megjegyzés – opcionális" style={{ borderWidth: 1, padding: 8 }} />
          <Button title="Hozzáadás" onPress={onAdd} />
        </View>
      )}

      {/* Lista */}
      {events.length === 0 ? (
        <Text>Nincs esemény.</Text>
      ) : (
        events.map(ev => (
          <View key={ev.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' }}>
            <Text style={{ fontSize: 16, fontWeight: '600' }}>{ev.title}</Text>
            <Text style={{ fontSize: 12, color: '#666' }}>
              Kezdés: {fmt(ev.starts_at)}  •  Vég: {fmt(ev.ends_at)}{'\n'}
              {ev.notes ? `Megjegyzés: ${ev.notes}` : ''}
            </Text>
            {f.isParentOrAdmin && (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                <Button title="Törlés" onPress={async () => {
                  try { await removeEvent(ev.id); }
                  catch { alert('Nincs jogosultság törölni.'); }
                }} />
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}
