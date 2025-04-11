import AsyncStorage from '@react-native-async-storage/async-storage';
import { Entry } from '../types/Entry';

const STORAGE_KEY = '@travel_entries';

export const getEntries = async (): Promise<Entry[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const entries = JSON.parse(data);
    console.log('Loaded entries:', entries);
    return entries;
  } catch (error) {
    console.error('Error loading entries:', error);
    return [];
  }
};

export const saveEntry = async (entry: Entry): Promise<void> => {
  try {
    console.log('Saving entry:', entry);
    const entries = await getEntries();
    const newEntries = [...entries, entry];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
    console.log('Entry saved successfully');
  } catch (error) {
    console.error('Error saving entry:', error);
    throw error;
  }
};

export const removeEntry = async (id: string): Promise<void> => {
  try {
    const entries = await getEntries();
    const filtered = entries.filter((entry) => entry.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing entry:', error);
    throw error;
  }
}; 