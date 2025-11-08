import { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, TouchableOpacity } from 'react-native';
import { useAppState } from '../lib/useAppState';
import { TaskRow, fetchTasks, createTask, setDone, removeTask } from '../lib/tasks';
import { supabase } from '../lib/supabase';

export default function TasksScreen() {
  const { householdId } = useAppState();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');          // YYYY-MM-DD
  const [assignMe, setAssignMe] = useState(false);

  // Ha nincs kiválasztott háztartás, csak infó
  if (!householdId) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text>Nincs kiválasztott háztartás. Menj a Háztartás fülre és hozz létre vagy válassz egyet.</Text>
      </ScrollView>
    );
  }

  // --- FONTOS: householdId paraméterként megy a segédfüggvénybe ---
  async function load(hid: string) {
    const list = await fetchTasks(hid);
    setTasks(list);
  }

  // első betöltés + household váltás
  useEffect(() => { load(householdId); }, [householdId]);

  // Realtime: változáskor újratölt
  useEffect(() => {
    const ch = supabase
      .channel(`tasks-${householdId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => load(householdId))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [householdId]);

  async function onAdd() {
    const trimmed = title.trim();
    if (!trimmed) return;

    const dueIso = due ? `${due}T00:00:00.000Z` : null;
    await createTask(householdId, trimmed, { due: dueIso, assignToSelf: assignMe });

    setTitle('');
    setDue('');
    setAssignMe(false);
    // realtime miatt nem muszáj load()
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '600' }}>Teendők</Text>

      {/* Új teendő */}
      <View style={{ gap: 8, padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8 }}>
        <Text style={{ fontWeight: '600' }}>Új teendő</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Cím"
          style={{ borderWidth: 1, padding: 8 }}
        />
        <TextInput
          value={due}
          onChangeText={setDue}
          placeholder="Határidő (YYYY-MM-DD) – opcionális"
          style={{ borderWidth: 1, padding: 8 }}
        />
        <TouchableOpacity onPress={() => setAssignMe(x => !x)}>
          <Text>{assignMe ? 'Felelős: Én' : 'Felelős: Nincs / később'}</Text>
        </TouchableOpacity>
        <Button title="Hozzáadás" onPress={onAdd} />
      </View>

      {/* Lista */}
      {tasks.length === 0 ? (
        <Text>Nincs teendő.</Text>
      ) : (
        tasks.map(t => (
          <View key={t.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' }}>
            <TouchableOpacity onPress={() => setDone(t.id, !t.done)}>
              <Text style={{ fontSize: 16, textDecorationLine: t.done ? 'line-through' : 'none' }}>
                {t.title}
              </Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 12, color: '#666' }}>
              {t.due_at ? `Határidő: ${t.due_at.slice(0,10)}` : 'Nincs határidő'}
              {'  '}•{'  '}
              {t.assignee ? 'Felelős: kijelölve' : 'Felelős: nincs'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
              <Button title={t.done ? 'Visszavon' : 'Kész'} onPress={() => setDone(t.id, !t.done)} />
              <Button title="Törlés" onPress={() => removeTask(t.id)} />
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}
