import { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { Link } from 'expo-router';

export default function Home() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const session = supabase.auth.getSession();

  async function signIn() {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else alert('OK');
  }

  async function signUp() {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert('Ellenőrizd az emailedet / Check your email');
  }

  async function signOut() {
    await supabase.auth.signOut();
    alert('Signed out');
  }

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: '600' }}>{t('app.title')}</Text>

      <Text>{t('auth.email')}</Text>
      <TextInput value={email} onChangeText={setEmail} autoCapitalize="none"
        style={{ borderWidth: 1, padding: 8 }} />

      <Text>{t('auth.password')}</Text>
      <TextInput value={password} onChangeText={setPassword} secureTextEntry
        style={{ borderWidth: 1, padding: 8 }} />

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button title={t('auth.signIn')} onPress={signIn} />
        <Button title={t('auth.signUp')} onPress={signUp} />
        <Button title={t('auth.signOut')} onPress={signOut} />
      </View>

      <View style={{ height: 16 }} />
      <Text style={{ fontSize: 18 }}>Navigáció</Text>
      <Link href="/shopping"><Text>→ {t('nav.shopping')}</Text></Link>
      <Link href="/tasks"><Text>→ {t('nav.tasks')}</Text></Link>
      <Link href="/calendar"><Text>→ {t('nav.calendar')}</Text></Link>
    </View>
  );
}