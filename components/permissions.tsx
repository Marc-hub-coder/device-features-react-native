import { requestCameraPermissionsAsync, requestMediaLibraryPermissionsAsync } from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

export const requestAllPermissions = async () => {
  const { status: cameraStatus } = await requestCameraPermissionsAsync();
  const { status: mediaStatus } = await requestMediaLibraryPermissionsAsync();
  const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
  const { status: notifStatus } = await Notifications.requestPermissionsAsync();

  if (
    cameraStatus !== 'granted' ||
    mediaStatus !== 'granted' ||
    locationStatus !== 'granted' ||
    notifStatus !== 'granted'
  ) {
    throw new Error('Required permissions not granted');
  }
};