import { Tabs, router } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/config/colors';
import { useAppStore } from '../../src/store/useAppStore';

const ROUTES_PUBLIER = {
  vehicules:   '/vehicule/publier',
  logements:   '/logement/publier',
  marketplace: '/article/publier',
} as const;

function BoutonCentre() {
  return (
    <View style={styles.boutonCentre}>
      <Ionicons name="add" size={28} color={Colors.white} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.38)',
        tabBarLabelStyle: styles.label,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explorer',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'sunny' : 'sunny-outline'}
              size={26}
              color={color as string}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Favoris',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'heart' : 'heart-outline'}
              size={24}
              color={color as string}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="publier"
        // Le bouton "+" ouvre directement le bon formulaire (par-dessus les tabs)
        // selon la section active, à chaque appui.
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            const section = useAppStore.getState().section;
            router.push(ROUTES_PUBLIER[section] as any);
          },
        }}
        options={{
          title: '',
          tabBarIcon: () => <BoutonCentre />,
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
              size={24}
              color={color as string}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={24}
              color={color as string}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0D1729',
    borderTopWidth: 0,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.30,
    shadowRadius: 16,
    height: 72,
    paddingBottom: 10,
    paddingTop: 6,
  },
  label: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  boutonCentre: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 10,
  },
});
