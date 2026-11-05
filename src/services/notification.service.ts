import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const enregistrerNotifications = async (userId: string): Promise<void> => {
  if (!Device.isDevice) return; // pas de push sur simulateur

  const { status: existant } = await Notifications.getPermissionsAsync();
  let statut = existant;

  if (statut !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    statut = status;
  }

  if (statut !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'BABI RENT',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF7A00',
    });
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync();

  await supabase
    .from('users')
    .update({ push_token: token })
    .eq('id', userId);
};
