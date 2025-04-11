import * as Notifications from 'expo-notifications';

export const sendSavedNotification = async () => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Travel Entry Saved!',
      body: 'Your travel moment was successfully saved.',
    },
    trigger: null,
  });
}; 