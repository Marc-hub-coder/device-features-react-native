import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, Alert, SafeAreaView, Platform, StatusBar, Modal, Dimensions } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getEntries, removeEntry, saveEntry } from '../services/storage';
import { Entry } from '../types/Entry';
import { RootStackParamList } from '../App';
import { useTheme } from '../components/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const isFocused = useIsFocused();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    if (isFocused) {
      loadEntries();
    }
  }, [isFocused]);

  const loadEntries = async () => {
    try {
    const stored = await getEntries();
      const sortedEntries = stored.sort((a, b) => b.timestamp - a.timestamp);
      setEntries(sortedEntries);
    } catch (error) {
      console.error('Error loading entries:', error);
      Alert.alert('Error', 'Failed to load entries');
    }
  };

  const deleteEntry = async (id: string) => {
    try {
    await removeEntry(id);
      await loadEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      Alert.alert('Error', 'Failed to delete entry');
    }
  };

  const toggleFavorite = async (entry: Entry) => {
    try {
      const updatedEntry = { ...entry, isFavorite: !entry.isFavorite };
      await saveEntry(updatedEntry);
      await loadEntries();
    } catch (error) {
      console.error('Error updating favorite:', error);
      Alert.alert('Error', 'Failed to update favorite');
    }
  };

  const filteredEntries = showFavoritesOnly 
    ? entries.filter(entry => entry.isFavorite)
    : entries;

  const renderItem = ({ item }: { item: Entry }) => (
    <View style={[styles.item, isDark && styles.itemDark]}>
      <TouchableOpacity 
        style={styles.imageContainer}
        onPress={() => setSelectedEntry(item)}
      >
        <Image 
          source={{ uri: item.imageUri }} 
          style={styles.mainImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
      <View style={[styles.itemContent, isDark && styles.itemContentDark]}>
        <View style={styles.itemHeader}>
          <Text style={[styles.locationName, isDark && styles.locationNameDark]}>{item.address}</Text>
          <Text style={[styles.date, isDark && styles.dateDark]}>
            {new Date(item.timestamp).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.interactionBar}>
          <TouchableOpacity 
            style={styles.interactionButton}
            onPress={() => toggleFavorite(item)}
          >
            <Ionicons 
              name={item.isFavorite ? "heart" : "heart-outline"} 
              size={24} 
              color={item.isFavorite ? "#FF3B30" : (isDark ? "#fff" : "#666")} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.interactionButton} onPress={() => deleteEntry(item.id)}>
            <Ionicons name="trash-outline" size={22} color={isDark ? "#fff" : "#666"} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <SafeAreaView style={{ flex: 0, backgroundColor: isDark ? '#1C1C1E' : '#fff' }} />
      <View style={[styles.mainContent, isDark && styles.containerDark]}>
        <View style={[styles.header, isDark && styles.headerDark]}>
          <View style={styles.headerSide}>
            <TouchableOpacity 
              style={[styles.filterButton, isDark && styles.filterButtonDark]}
              onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              <Ionicons 
                name={showFavoritesOnly ? "heart" : "heart-outline"} 
                size={20} 
                color={showFavoritesOnly ? "#FF3B30" : (isDark ? "#fff" : "#666")} 
              />
            </TouchableOpacity>
          </View>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>TRAVELOG</Text>
          <View style={styles.headerSide}>
            <TouchableOpacity style={styles.profileButton}>
              <Image 
                source={{ uri: 'https://via.placeholder.com/40' }}
                style={styles.profileImage}
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.themeToggle, isDark && styles.themeToggleDark]} 
              onPress={toggleTheme}
            >
              <Ionicons 
                name={isDark ? "sunny" : "moon-outline"} 
                size={18} 
                color={isDark ? "#FDB813" : "#555"} 
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.addUpdateButton, isDark && styles.addUpdateButtonDark]}
          onPress={() => navigation.navigate('AddEntry')}
        >
          <Ionicons name="add-circle" size={24} color="#007AFF" />
          <Text style={[styles.addUpdateText, isDark && styles.addUpdateTextDark]}>Add a memory</Text>
          <Ionicons name="chevron-forward" size={24} color={isDark ? "#666" : "#999"} />
        </TouchableOpacity>

        <View style={styles.contentContainer}>
          <FlatList 
            data={filteredEntries}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>No entries yet!</Text>
              </View>
            }
          />
        </View>
      </View>

      <View style={[styles.bottomNav, isDark && styles.bottomNavDark]}>
        <SafeAreaView style={[styles.bottomNavContent, { backgroundColor: isDark ? '#1C1C1E' : '#fff' }]}>
          <TouchableOpacity style={styles.bottomNavItem}>
            <Ionicons name="home" size={24} color="#007AFF" />
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      <Modal
        visible={!!selectedEntry}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedEntry(null)}
      >
        <View style={[styles.modalContainer, isDark && styles.modalContainerDark]}>
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={() => setSelectedEntry(null)}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          
          <Animatable.View 
            animation="fadeInUp"
            duration={300}
            style={styles.modalContent}
          >
            {selectedEntry && (
              <>
                <Image 
                  source={{ uri: selectedEntry.imageUri }} 
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
                <View style={styles.modalInfo}>
                  <Text style={[styles.modalLocation, isDark && styles.modalLocationDark]}>
                    {selectedEntry.address}
                  </Text>
                  <Text style={[styles.modalDate, isDark && styles.modalDateDark]}>
                    {new Date(selectedEntry.timestamp).toLocaleDateString()}
                  </Text>
                  {selectedEntry.description && (
                    <Text style={[styles.modalDescription, isDark && styles.modalDescriptionDark]}>
                      {selectedEntry.description}
                    </Text>
                  )}
                </View>
              </>
            )}
          </Animatable.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  mainContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    height: 70,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E9ECEF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  headerSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minWidth: 100,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    flex: 1,
    letterSpacing: 0.5,
  },
  headerTitleDark: {
    color: '#fff',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  filterButtonDark: {
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: '#333',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  themeToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  themeToggleDark: {
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: '#333',
  },
  addUpdateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: 8,
  },
  addUpdateButtonDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  addUpdateText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  addUpdateTextDark: {
    color: '#fff',
  },
  contentContainer: {
    flex: 1,
    paddingTop: 8,
  },
  item: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  itemDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#f5f5f5',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  itemContent: {
    padding: 16,
  },
  itemContentDark: {
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  itemHeader: {
    marginBottom: 12,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  locationNameDark: {
    color: '#fff',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  dateDark: {
    color: '#999',
  },
  interactionBar: {
    flexDirection: 'row',
    gap: 20,
  },
  interactionButton: {
    padding: 4,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  emptyTextDark: {
    color: '#666',
  },
  bottomNav: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E9ECEF',
  },
  bottomNavDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  bottomNavContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 12,
  },
  bottomNavItem: {
    padding: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  descriptionDark: {
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  modalContainerDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.7,
  },
  modalInfo: {
    padding: 20,
    width: '100%',
  },
  modalLocation: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  modalLocationDark: {
    color: '#fff',
  },
  modalDate: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 16,
  },
  modalDateDark: {
    color: '#999',
  },
  modalDescription: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
  },
  modalDescriptionDark: {
    color: '#fff',
  },
});

export default HomeScreen;