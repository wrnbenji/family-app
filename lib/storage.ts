import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import localforage from 'localforage';

export const localStore = {
  async getItem(key: string) {
    return Platform.OS === 'web' ? localforage.getItem<string>(key) : AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    return Platform.OS === 'web' ? localforage.setItem(key, value) : AsyncStorage.setItem(key, value);
  },
  async removeItem(key: string) {
    return Platform.OS === 'web' ? localforage.removeItem(key) : AsyncStorage.removeItem(key);
  }
};