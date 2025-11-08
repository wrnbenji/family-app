import { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, TouchableOpacity } from 'react-native';
import { useAppState } from '../lib/useAppState';
import { TaskRow, fetchTasks, createTask, setDone, removeTask } from '../lib/tasks';
import { supabase } from '../lib/supabase';
import { getMyRole, flags, type Role } from '../lib/roles';

export default function TasksScreen() {
  const { householdId } = useAppState();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [title, setTitle] = useState('');
  const [due, setDue] = useState(''); // YYYY-MM-DD
  const [assignMe, setAssignMe] = useState(false);

  const [myRole, setMyRole] = useState<Role>(null);
  const f = flags(myRole);

  // Guard – ha nincs háztartás
  if (!householdId) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text>Nincs kiválasztott háztartás. Menj a Háztartás fülre és válassz egyet.</Text>
      </ScrollView>
    );
  }

  const hid: string = householdId;

  async function load() {
    const list = await fetchTasks(hid);
    setTasks(list);
  }

  // Role betöltés (háztartás váltáskor)
  useEffect(() => {
    (async () => {
      const r = await getMyRole(hid);
      setMyRole(r);
    })();
  }, [hid]);

  // Gyerekszerepnél kényszerítsük, hogy magának jelölje ki
  useEffect(() => {
    if (myRole === 'child') setAssignMe(true);
  }, [myRole]);

  // Lista betöltés + realtime
  useEffect(() => { load(); }, [hid]);

  useEffect(() => {
    const ch = supabase
      .channel(`tasks-${hid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [hid]);

  async function onAdd() {
    const trimmed = title.trim();
    if (!trimmed) return;

    // Gyerek: csak magának rögzíthet
    if (myRole === 'child' && !assignMe) {
      alert('Gyerekként csak magadnak vehetsz fel teendőt.');
      return;
    }

    const dueIso = due ? `${due}T00:00:00.000Z` : null;
    await createTask(hid, trimmed, { due: dueIso, assignToSelf: assignMe });
    setTitle('');
    setDue('');
    setAssignMe(myRole === 'child'); // gyereknél maradjon bepipálva
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
        <TouchableOpacity
          onPress={() => (myRole === 'child' ? null : setAssignMe(x => !x))}
          disabled={myRole === 'child'}
        >
          <Text>
            {assignMe ? 'Felelős: Én' : 'Felelős: Nincs / később'}
            {myRole === 'child' ? ' (gyerekként kötelező magadnak)' : ''}
          </Text>
        </TouchableOpacity>
        <Button title="Hozzáadás" onPress={onAdd} />
      </View>

      {/* Lista */}
      {tasks.length === 0 ? (
        <Text>Nincs teendő.</Text>
      ) : (
        tasks.map(t => (
          <View key={t.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' }}>
            <TouchableOpacity onPress={async () => {
              try {
                await setDone(t.id, !t.done);
              } catch (e: any) {
                alert('Nincs jogosultság a módosításhoz.');
              }
            }}>
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
              <Button
                title={t.done ? 'Visszavon' : 'Kész'}
                onPress={async () => {
                  try {
                    await setDone(t.id, !t.done);
                  } catch {
                    alert('Nincs jogosultság a módosításhoz.');
                  }
                }}
              />
              {f.isParentOrAdmin && (
                <Button
                  title="Törlés"
                  onPress={async () => {
                    try {
                      await removeTask(t.id);
                    } catch {
                      alert('Nincs jogosultság törölni.');
                    }
                  }}
                />
              )}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}
