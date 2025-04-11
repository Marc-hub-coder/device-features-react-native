import * as Location from 'expo-location';

export const getCurrentAddress = async (): Promise<string> => {
  const location = await Location.getCurrentPositionAsync({});
  const geocode = await Location.reverseGeocodeAsync(location.coords);
  const address = geocode[0];
  return `${address.name}, ${address.city}, ${address.country}`;
}; 