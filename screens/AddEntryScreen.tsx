import React, { useState, useEffect } from 'react';
import { View, Text, Image, Alert, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, Modal, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { saveEntry } from '../services/storage';
import { Entry } from '../types/Entry';
import { RootStackParamList } from '../App';
import { useTheme } from '../components/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

// Set up notifications configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

type AddEntryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AddEntry'>;

const AddEntryScreen = () => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [address, setAddress] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const navigation = useNavigation<AddEntryScreenNavigationProp>();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const requestNotificationPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Notifications are needed to alert you when memories are saved.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const showSavedNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Memory Saved! 📸",
          body: `Your memory from ${address} has been saved successfully!`,
          data: { screen: 'Home' },
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const getAddressFromLocation = async (latitude: number, longitude: number) => {
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode.length > 0) {
        const place = reverseGeocode[0];
        const addressParts = [
          place.city,
          place.region,
          place.country,
        ].filter(Boolean);
        return addressParts.join(', ');
      }
      return 'Unknown location';
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return 'Could not get address';
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        alert("Camera permission is required to take pictures.");
        return;
      }

      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
        alert('Location permission is required to get the address.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 1,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0].uri) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        
        try {
          const location = await Location.getCurrentPositionAsync({});
          const { latitude, longitude } = location.coords;
          const addr = await getAddressFromLocation(latitude, longitude);
          setAddress(addr);
        } catch (e) {
          console.error('Location error:', e);
          Alert.alert('Error', 'Could not get location');
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    }
  };

  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Gallery access is needed to choose photos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0].uri) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        
        try {
          const location = await Location.getCurrentPositionAsync({});
          const { latitude, longitude } = location.coords;
          const addr = await getAddressFromLocation(latitude, longitude);
          setAddress(addr);
        } catch (e) {
          console.error('Location error:', e);
          Alert.alert('Error', 'Could not get location');
        }
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to pick image from gallery. Please try again.');
    }
  };

  const save = async () => {
    try {
      if (!imageUri || !address) {
        Alert.alert('Missing Data', 'Please take a photo and wait for address');
        return;
      }

      const entry: Entry = {
        id: generateId(),
        imageUri,
        address,
        timestamp: Date.now(),
        description: description.trim() || undefined,
        isFavorite: isFavorite,
      };

      await saveEntry(entry);
      await showSavedNotification();
      
      Alert.alert(
        'Success',
        'Photo has been successfully saved!',
        [
          {
            text: 'OK',
            onPress: () => {
              setImageUri(null);
              setAddress('');
              setDescription('');
              setIsFavorite(false);
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    }
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons 
            name="chevron-back" 
            size={24} 
            color={isDark ? "#fff" : "#333"} 
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>Add Entry</Text>
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

      <View style={styles.content}>
        {imageUri ? (
          <View style={styles.previewContainer}>
            <TouchableOpacity 
              style={styles.imageContainer}
              onPress={() => setIsImageModalVisible(true)}
            >
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            </TouchableOpacity>
            <View style={styles.locationBar}>
              <View style={styles.locationInfo}>
                <Text style={[styles.locationSubtitle, isDark && styles.locationSubtitleDark]}>{address}</Text>
                {description ? (
                  <Text style={[styles.description, isDark && styles.descriptionDark]}>{description}</Text>
                ) : null}
              </View>
              <View style={styles.interactionBar}>
                <TouchableOpacity onPress={() => setIsFavorite(!isFavorite)}>
                  <Ionicons 
                    name={isFavorite ? "heart" : "heart-outline"} 
                    size={24} 
                    color={isFavorite ? "#FF3B30" : (isDark ? "#fff" : "#666")} 
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsCommentModalVisible(true)}>
                  <Ionicons 
                    name={description ? "chatbubble" : "chatbubble-outline"} 
                    size={22} 
                    color={isDark ? "#fff" : "#666"} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.addPhotoContainer}>
            <TouchableOpacity 
              style={[styles.photoOption, isDark && styles.photoOptionDark]} 
              onPress={pickImage}
            >
              <View style={[styles.iconContainer, isDark && styles.iconContainerDark]}>
                <Ionicons name="camera" size={32} color="#007AFF" />
              </View>
              <Text style={[styles.photoOptionText, isDark && styles.photoOptionTextDark]}>Take a Photo</Text>
            </TouchableOpacity>

            <View style={styles.separator}>
              <View style={[styles.separatorLine, isDark && styles.separatorLineDark]} />
              <Text style={[styles.separatorText, isDark && styles.separatorTextDark]}>or</Text>
              <View style={[styles.separatorLine, isDark && styles.separatorLineDark]} />
            </View>

            <TouchableOpacity 
              style={[styles.photoOption, isDark && styles.photoOptionDark]} 
              onPress={pickFromGallery}
            >
              <View style={[styles.iconContainer, isDark && styles.iconContainerDark]}>
                <Ionicons name="images" size={32} color="#007AFF" />
              </View>
              <Text style={[styles.photoOptionText, isDark && styles.photoOptionTextDark]}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal
        visible={isCommentModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => setIsCommentModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Animatable.View 
            animation="fadeIn"
            duration={300}
            easing="ease-out"
            style={[styles.modalBackground, isDark && styles.modalContainerDark]}
          >
            <TouchableOpacity 
              style={styles.modalBackgroundTouchable}
              activeOpacity={1}
              onPress={() => setIsCommentModalVisible(false)}
            />
          </Animatable.View>
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingView}
          >
            <Animatable.View 
              animation="fadeInUp"
              duration={400}
              easing="ease-out"
              style={[styles.modalContent, isDark && styles.modalContentDark]}
            >
              <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>Add Description</Text>
              <TextInput
                style={[styles.commentInput, isDark && styles.commentInputDark]}
                placeholder="Write something about this memory..."
                placeholderTextColor={isDark ? "#666" : "#999"}
                value={description}
                onChangeText={setDescription}
                multiline
                maxLength={200}
                autoFocus
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[
                    styles.modalButton, 
                    styles.modalButtonSecondary, 
                    isDark && styles.modalButtonSecondaryDark
                  ]} 
                  onPress={() => setIsCommentModalVisible(false)}
                >
                  <Text style={[
                    styles.modalButtonTextSecondary, 
                    isDark && styles.modalButtonTextSecondaryDark
                  ]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalButtonPrimary]} 
                  onPress={() => setIsCommentModalVisible(false)}
                >
                  <Text style={styles.modalButtonTextPrimary}>Save</Text>
                </TouchableOpacity>
              </View>
            </Animatable.View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        visible={isImageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsImageModalVisible(false)}
      >
        <View style={[styles.fullScreenModalContainer, isDark && styles.fullScreenModalContainerDark]}>
          <View style={styles.fullScreenModalBackground}>
            {imageUri && (
              <Image 
                source={{ uri: imageUri }} 
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )}
          </View>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setIsImageModalVisible(false)}
          >
            <Ionicons name="close" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </Modal>

      {imageUri && (
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={save}
        >
          <Text style={styles.saveButtonText}>Save Memory</Text>
        </TouchableOpacity>
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E9ECEF',
  },
  headerDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  headerTitleDark: {
    color: '#fff',
  },
  themeToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  content: {
    flex: 1,
    padding: 16,
  },
  addPhotoContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
  },
  photoOption: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#eee',
  },
  photoOptionDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#333',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainerDark: {
    backgroundColor: '#262626',
  },
  photoOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  photoOptionTextDark: {
    color: '#fff',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#eee',
  },
  separatorLineDark: {
    backgroundColor: '#333',
  },
  separatorText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  separatorTextDark: {
    color: '#666',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    margin: 16,
  },
  previewContainerDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  imageContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  locationBar: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  locationInfo: {
    flex: 1,
    marginRight: 16,
  },
  locationSubtitle: {
    fontSize: 14,
    color: '#495057',
  },
  locationSubtitleDark: {
    color: '#E9ECEF',
  },
  interactionBar: {
    flexDirection: 'row',
    gap: 16,
    paddingRight: 8,
  },
  saveButton: {
    margin: 16,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    justifyContent: 'flex-end',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  modalBackgroundTouchable: {
    flex: 1,
  },
  modalContainerDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  keyboardAvoidingView: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
    width: '100%',
  },
  modalContentDark: {
    backgroundColor: '#1C1C1E',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  modalTitleDark: {
    color: '#fff',
  },
  commentInput: {
    height: 120,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#212529',
    backgroundColor: '#F8F9FA',
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  commentInputDark: {
    borderColor: '#333',
    backgroundColor: '#262626',
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#007AFF',
  },
  modalButtonSecondary: {
    backgroundColor: '#f0f0f0',
  },
  modalButtonSecondaryDark: {
    backgroundColor: '#2C2C2E',
  },
  modalButtonTextPrimary: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  modalButtonTextSecondary: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  modalButtonTextSecondaryDark: {
    color: '#fff',
  },
  fullScreenModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  fullScreenModalContainerDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  fullScreenModalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    right: 20,
    padding: 10,
  },
});

export default AddEntryScreen;
