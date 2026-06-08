import 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { setTokenStorage } from '@finexa/api';

/**
 * Override the default localStorage token storage with expo-secure-store.
 * This MUST be called before any API call is made.
 */
setTokenStorage({
  getItem: (key: string) => SecureStore.getItem(key),
  setItem: (key: string, value: string) => { SecureStore.setItem(key, value); },
  removeItem: (key: string) => { SecureStore.deleteItem(key); },
});
