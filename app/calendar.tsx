import { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, TouchableOpacity } from 'react-native';
import { useAppState } from '../lib/useAppState';
import { fetchEvents, createEvent, removeEvent, EventRow } from '../lib/events';
import { supabase } from '../lib/supabase';

export default function CalendarScreen() {
  const { householdId } = useAppState();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');       // YYYY-MM-DD
  const [start, setStart] = useState('');     // HH:MM
  const [end, setEnd] = useState('');         // HH:MM (opcionális)
  const [notes, setNotes] = useState('');

  if (!householdId) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text>Nincs kiválasztott háztartás. Menj a Háztartás fülre és válassz egyet.</Text>
      </ScrollView>
    );
  }

  async function load(hid: string) {
    const list = await fetchEvents(hid);
    setEvents(list);
  }

  useEffect(() => { load(householdId); }, [householdId]);

  useEffect(() => {
    const ch = supabase
      .channel(`events-${householdId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => load(householdId))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [householdId]);

  async function onAdd() {
    const t = title.trim();
    if (!t || !date || !start) return;
    const startsISO = `${date}T${start}:00.000Z`;
    const endsISO = end ? `${date}T${end}:00.000Z` : null;
    await createEvent(householdId, t, startsISO, endsISO, notes.trim() || null);
    setTitle(''); setDate(''); setStart(''); setEnd(''); setNotes('');
  }

  function fmt(dt?: string | null) {
    return dt ? dt.slice(0,16).replace('T',' ') : '-';
    // egyszerű formatter: "YYYY-MM-DD HH:MM"
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '600' }}>Naptár</Text>

      {/* Új esemény */}
      <View style={{ gap: 8, padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8 }}>
        <Text style={{ fontWeight: '600' }}>Új esemény</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="Cím" style={{ borderWidth: 1, padding: 8 }} />
        <TextInput value={date} onChangeText={setDate} placeholder="Dátum (YYYY-MM-DD)" style={{ borderWidth: 1, padding: 8 }} />
        <TextInput value={start} onChangeText={setStart} placeholder="Kezdés (HH:MM)" style={{ borderWidth: 1, padding: 8 }} />
        <TextInput value={end} onChangeText={setEnd} placeholder="Vég (HH:MM) – opcionális" style={{ borderWidth: 1, padding: 8 }} />
        <TextInput value={notes} onChangeText={setNotes} placeholder="Megjegyzés – opcionális" style={{ borderWidth: 1, padding: 8 }} />
        <Button title="Hozzáadás" onPress={onAdd} />
      </View>

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
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
              <Button title="Törlés" onPress={() => removeEvent(ev.id)} />
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}
