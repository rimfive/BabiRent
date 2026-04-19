import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../src/config/firebase';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Colors } from '../../src/config/colors';
import { Conversation } from '../../src/types';
import { depuisMaintenant } from '../../src/utils/formatters';

export default function ChatScreen() {
  const { utilisateur } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    if (!utilisateur) return;

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', utilisateur.id),
      orderBy('dernierMessageDate', 'desc'),
    );

    const unsub = onSnapshot(q, snap => {
      const convs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Conversation));
      setConversations(convs);
      setChargement(false);
    }, () => setChargement(false));

    return unsub;
  }, [utilisateur]);

  const renderConversation = ({ item }: { item: Conversation }) => (
    <Pressable style={styles.conv}>
      <View style={styles.avatarConv}>
        <Ionicons name="person" size={22} color={Colors.primary} />
        {item.nonLu > 0 && (
          <View style={styles.badge}>
            <Text style={styles.texteBadge}>{item.nonLu}</Text>
          </View>
        )}
      </View>
      <View style={styles.convInfos}>
        <View style={styles.convHeader}>
          <Text style={styles.convTitre} numberOfLines={1}>
            {item.typeAnnonce === 'vehicule' ? '🚗' : '🏠'} Conversation
          </Text>
          <Text style={styles.convDate}>
            {item.dernierMessageDate ? depuisMaintenant(item.dernierMessageDate) : ''}
          </Text>
        </View>
        <Text style={styles.dernierMsg} numberOfLines={1}>
          {item.dernierMessage || 'Nouvelle conversation'}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.conteneur}>
      <Text style={styles.titre}>Messages</Text>

      {chargement ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : conversations.length === 0 ? (
        <View style={styles.vide}>
          <Ionicons name="chatbubbles-outline" size={64} color={Colors.gray300} />
          <Text style={styles.titreVide}>Aucun message</Text>
          <Text style={styles.sousVide}>Tes conversations avec les propriétaires apparaîtront ici.</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.id}
          renderItem={renderConversation}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separateur} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: Colors.background },
  titre: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, paddingHorizontal: 16, marginBottom: 16, marginTop: 8 },
  loader: { marginTop: 60 },
  vide: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 40 },
  titreVide: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  sousVide: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  conv: { flexDirection: 'row', padding: 16, alignItems: 'center', gap: 14 },
  avatarConv: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: Colors.error, borderRadius: 10,
    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  texteBadge: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  convInfos: { flex: 1 },
  convHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  convTitre: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  convDate: { fontSize: 12, color: Colors.textSecondary },
  dernierMsg: { fontSize: 13, color: Colors.textSecondary },
  separateur: { height: 1, backgroundColor: Colors.borderLight, marginLeft: 80 },
});
