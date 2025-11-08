import { Tabs } from 'expo-router';
import '../lib/i18n';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable } from 'react-native';

function LangSwitcher() {
  const { i18n } = useTranslation();
  return (
    <View style={{ flexDirection: 'row', gap: 8, paddingRight: 12 }}>
      {['hu','de','en'].map(l => (
        <Pressable key={l} onPress={() => i18n.changeLanguage(l)}>
          <Text style={{ fontWeight: i18n.language === l ? 'bold' : 'normal' }}>{l.toUpperCase()}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function Layout() {
  return (
    <Tabs screenOptions={{ headerRight: () => <LangSwitcher /> }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="tasks" options={{ title: 'Teendők' }} />
      <Tabs.Screen name="shopping" options={{ title: 'Bevásárló' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Naptár' }} />
      <Tabs.Screen name="household" options={{ title: 'Háztartás' }} />
    </Tabs>
  );
}