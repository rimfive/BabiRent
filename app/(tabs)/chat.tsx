import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Colors } from '../../src/config/colors';
import { supabase } from '../../src/config/supabase';
import { depuisMaintenant } from '../../src/utils/formatters';

type Conv = {
  id: string;
  participants: string[];
  dernier_message?: string;
  dernier_message_date?: string;
  type_annonce?: string;
  titre_annonce?: string;
  annonce_id?: string;
  non_lu: number;
};

const nettoyerTitre = (s: string) =>
  s.replace(/^(🚗|🏠|🛍️|🚙|🏡|🔑)\s*/u, '').trim();

// Charge l'image de l'annonce pour une conversation
function ConvItem({ item, onPress }: { item: Conv; onPress: () => void }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!item.annonce_id || !item.type_annonce) return;
    const table = item.type_annonce === 'vehicule' ? 'vehicules' : 'logements';
    supabase
      .from(table)
      .select('photos')
      .eq('id', item.annonce_id)
      .single()
      .then(({ data }) => {
        if (data?.photos?.[0]) setImgUrl(data.photos[0]);
      });
  }, [item.id, item.annonce_id, item.type_annonce]);

  const isLogement = item.type_annonce === 'logement';
  const placeholderBg    = isLogement ? '#0f2e1a' : '#0f1f2e';
  const placeholderColor = isLogement ? Colors.success : Colors.accent;
  const placeholderIcon  = isLogement ? 'home' : 'car-sport';

  return (
    <Pressable style={styles.conv} onPress={onPress}>
      <View style={styles.avatarWrap}>
        {imgUrl ? (
          <Image source={{ uri: imgUrl }} style={styles.avatarImg} resizeMode="cover" />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: placeholderBg, borderColor: placeholderColor + '40' }]}>
            <Ionicons name={placeholderIcon as any} size={24} color={placeholderColor} />
          </View>
        )}
        {item.non_lu > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>{item.non_lu}</Text>
          </View>
        )}
      </View>

      <View style={styles.convInfos}>
        <View style={styles.convHeader}>
          <Text style={styles.convTitre} numberOfLines={1}>
            {item.titre_annonce
              ? nettoyerTitre(item.titre_annonce)
              : (item.type_annonce === 'logement' ? 'Logement' : 'Véhicule')}
          </Text>
          {item.dernier_message_date && (
            <Text style={styles.convDate}>{depuisMaintenant(item.dernier_message_date)}</Text>
          )}
        </View>
        {item.dernier_message ? (
          <Text style={[styles.dernierMsg, item.non_lu > 0 && styles.dernierMsgNonLu]} numberOfLines={1}>
            {item.dernier_message}
          </Text>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
    </Pressable>
  );
}

export default function ChatScreen() {
  const router = useRouter();
  const { utilisateur } = useAuthStore();
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {
    if (!utilisateur) return;
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .contains('participants', [utilisateur.id])
      .order('dernier_message_date', { ascending: false });

    setConversations(data ?? []);
    setChargement(false);
  }, [utilisateur]);

  // Recharger à chaque fois que l'onglet reprend le focus (retour d'une conversation)
  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger])
  );

  useEffect(() => {
    const channel = supabase
      .channel('conversations-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' },
        (payload) => {
          const conv = (payload.new ?? payload.old) as Conv | null;
          if (conv?.participants?.includes(utilisateur?.id ?? '')) {
            charger();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [charger]);

  const ouvrirConv = (item: Conv) => {
    router.push(
      `/chat/${item.id}?titre=${encodeURIComponent(item.titre_annonce ?? 'Conversation')}` as any
    );
  };

  return (
    <SafeAreaView style={styles.conteneur}>
      <View style={styles.headerRow}>
        <Text style={styles.titre}>Messages</Text>
        {conversations.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countTxt}>{conversations.length}</Text>
          </View>
        )}
      </View>

      {chargement ? (
        <View style={styles.centre}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.vide}>
          <Ionicons name="chatbubbles-outline" size={72} color={Colors.textLight} />
          <Text style={styles.titreVide}>Aucun message</Text>
          <Text style={styles.sousVide}>
            Ouvre la fiche d'un véhicule ou logement et appuie sur "Contacter" pour démarrer une conversation.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <ConvItem item={item} onPress={() => ouvrirConv(item)} />}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: Colors.background },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 16 },
  titre:      { fontSize: 24, fontWeight: '900', color: Colors.white },
  countBadge: { backgroundColor: Colors.accent, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  countTxt:   { color: Colors.white, fontSize: 13, fontWeight: '800' },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  vide:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 36 },
  titreVide: { fontSize: 18, fontWeight: '800', color: Colors.white },
  sousVide:  { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  conv: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },

  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatarImg:  { width: 54, height: 54, borderRadius: 14 },
  avatarPlaceholder: {
    width: 54, height: 54, borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: Colors.error, borderRadius: 10,
    minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  badgeTxt: { color: Colors.white, fontSize: 11, fontWeight: '800' },

  convInfos:  { flex: 1 },
  convHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  convTitre:  { fontSize: 14, fontWeight: '800', color: Colors.white, flex: 1, marginRight: 8 },
  convDate:   { fontSize: 11, color: Colors.textLight },
  dernierMsg:       { fontSize: 13, color: Colors.textSecondary },
  dernierMsgNonLu:  { color: Colors.white, fontWeight: '700' },
  sep: { height: 1, backgroundColor: Colors.border, marginLeft: 84 },
});
