import { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useShoppingStore, syncWithServer } from '../lib/useShoppingList';
import { useAppState } from '../lib/useAppState';
import { upsertShoppingItem, setShoppingDone, removeShoppingItem } from '../lib/shopping';

export default function ShoppingScreen() {
  const { t } = useTranslation();
  const [text, setText] = useState('');

  const items   = useShoppingStore(s => Object.values(s.items).sort((a,b)=> Number(a.checked)-Number(b.checked)));
  const add     = useShoppingStore(s => s.add);
  const toggle  = useShoppingStore(s => s.toggle);
  const setHH   = useShoppingStore(s => s.setHousehold);

  const { householdId } = useAppState();

  // Ha kiválasztottál háztartást, átadjuk a store-nak
  useEffect(() => { if (householdId) setHH(householdId); }, [householdId, setHH]);

  // Első betöltéskor és háztartásváltáskor szinkron
  useEffect(() => { if (householdId) syncWithServer(); }, [householdId]);

  // <<< EZ A HELYES GUARD >>>
  if (!householdId) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text>Nincs kiválasztott háztartás. Menj a Háztartás fülre és hozz létre vagy válassz egyet.</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={t('shopping.placeholder')}
          style={{ borderWidth: 1, padding: 8, flex: 1 }}
        />
        <Button
          title={t('shopping.addItem')}
          onPress={() => {
            if (text.trim()) { add(text.trim()); setText(''); syncWithServer(); }
          }}
        />
      </View>

      {items.length === 0 ? (
        <Text>{t('shopping.empty')}</Text>
      ) : (
        items.map(it => (
          <TouchableOpacity key={it.id} onPress={() => { toggle(it.id); syncWithServer(); }}>
            <Text style={{ textDecorationLine: it.checked ? 'line-through' : 'none', fontSize: 16 }}>
              {it.title}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}
