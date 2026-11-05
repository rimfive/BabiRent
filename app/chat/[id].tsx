import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Alert,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
  Animated, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Colors } from '../../src/config/colors';
import { supabase } from '../../src/config/supabase';
import { envoyerMessage, marquerConversationLue, supprimerMessage } from '../../src/services/chat.service';
import { depuisMaintenant } from '../../src/utils/formatters';

type Msg = {
  id: string;
  expediteur_id: string;
  contenu: string;
  created_at: string;
  local?: boolean;
};

export default function ChatConversationScreen() {
  const router = useRouter();
  const { id, titre } = useLocalSearchParams<{ id: string; titre?: string }>();
  const { utilisateur } = useAuthStore();

  const [messages, setMessages]       = useState<Msg[]>([]);
  const [chargement, setChargement]   = useState(true);
  const [texte, setTexte]             = useState('');
  const [envoi, setEnvoi]             = useState(false);
  const [titreConv, setTitreConv]     = useState(titre ?? 'Conversation');
  const [annonceImage, setAnnonceImage] = useState<string | null>(null);
  const flatRef      = useRef<FlatList>(null);
  const sendBtnAnim  = useRef(new Animated.Value(1)).current;
  const msgAnimMap   = useRef<Map<string, Animated.Value>>(new Map());

  // Charger le titre + image de l'annonce depuis Supabase
  useEffect(() => {
    if (!id) return;
    supabase.from('conversations')
      .select('titre_annonce, type_annonce, annonce_id')
      .eq('id', id).single()
      .then(({ data }) => {
        if (!titre) {
          if (data?.titre_annonce) setTitreConv(data.titre_annonce);
          else setTitreConv(data?.type_annonce === 'logement' ? '🏠 Logement' : '🚗 Véhicule');
        }
        if (data?.annonce_id && data?.type_annonce) {
          const table = data.type_annonce === 'vehicule' ? 'vehicules'
                      : data.type_annonce === 'logement' ? 'logements'
                      : 'articles';
          supabase.from(table).select('photos').eq('id', data.annonce_id).single()
            .then(({ data: ann }) => { if (ann?.photos?.[0]) setAnnonceImage(ann.photos[0]); });
        }
      });
  }, [id]);

  // Charger les messages initiaux
  useEffect(() => {
    if (!id) return;
    supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages(data ?? []);
        setChargement(false);
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 100);
      });

    // Marquer comme lu dès l'ouverture
    if (utilisateur?.id) {
      marquerConversationLue(id, utilisateur.id);
    }

    // Écoute en temps réel les nouveaux messages
    const channel = supabase
      .channel(`messages-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${id}`,
      }, (payload) => {
        const msg = payload.new as Msg;

        if (msg.expediteur_id === utilisateur?.id) {
          // Remplacer le message optimiste par le vrai (déjà animé, pas besoin de ré-animer)
          setMessages(prev => {
            const filtered = prev.filter(m => !(m.local && m.contenu === msg.contenu));
            return [...filtered, msg];
          });
        } else {
          setMessages(prev => [...prev, msg]);
        }

        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
        if (msg.expediteur_id !== utilisateur?.id && utilisateur?.id) {
          marquerConversationLue(id, utilisateur.id);
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${id}`,
      }, (payload) => {
        const deletedId = (payload.old as { id: string }).id;
        setMessages(prev => prev.filter(m => m.id !== deletedId));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, utilisateur?.id]);

  const envoyer = async () => {
    if (!texte.trim() || !utilisateur || !id || envoi) return;

    // Animation pop du bouton
    Animated.sequence([
      Animated.timing(sendBtnAnim, { toValue: 0.75, duration: 70, useNativeDriver: true }),
      Animated.spring(sendBtnAnim, { toValue: 1, tension: 220, friction: 5, useNativeDriver: true }),
    ]).start();

    const contenu = texte.trim();
    const localId = `local-${Date.now()}`;
    setTexte('');
    setEnvoi(true);

    // Message optimiste — visible instantanément avec animation
    const localMsg: Msg = {
      id: localId,
      expediteur_id: utilisateur.id,
      contenu,
      created_at: new Date().toISOString(),
      local: true,
    };
    const anim = new Animated.Value(0);
    msgAnimMap.current.set(localId, anim);
    setMessages(prev => [...prev, localMsg]);
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 50);
    Animated.spring(anim, { toValue: 1, tension: 120, friction: 8, useNativeDriver: true })
      .start(() => { msgAnimMap.current.delete(localId); });

    try {
      await envoyerMessage(id, utilisateur.id, contenu);
      // Le message réel arrive via realtime et remplace le local
    } catch (_) {
      setTexte(contenu);
      setMessages(prev => prev.filter(m => m.id !== localId));
    } finally {
      setEnvoi(false);
    }
  };

  const supprimer = async (msgId: string) => {
    setMessages(prev => prev.filter(m => m.id !== msgId));
    try {
      await supprimerMessage(msgId, id!);
    } catch {
      Alert.alert('Erreur', 'Impossible de supprimer ce message.');
    }
  };

  const confirmerSuppression = (msgId: string, isLocal?: boolean) => {
    if (isLocal) return; // message encore en envoi, pas encore sauvegardé
    Alert.alert(
      'Supprimer le message',
      'Ce message sera supprimé définitivement.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => supprimer(msgId) },
      ],
    );
  };

  const estMoi = (expediteurId: string) => expediteurId === utilisateur?.id;

  const renderMsg = ({ item, index }: { item: Msg; index: number }) => {
    const moi     = estMoi(item.expediteur_id);
    const prev    = messages[index - 1];
    const memeExp = prev && prev.expediteur_id === item.expediteur_id;
    const animVal = moi ? msgAnimMap.current.get(item.id) : undefined;

    const contenuBulle = (
      <>
        <Text style={[styles.bulleTexte, moi && styles.bulleTexteMoi]}>
          {item.contenu}
        </Text>
        {item.created_at && (
          <Text style={[styles.bulleDate, moi && styles.bulleDateMoi]}>
            {depuisMaintenant(item.created_at)}
          </Text>
        )}
      </>
    );

    const bulleStyle = [
      styles.bulle,
      moi ? styles.bulleMoi : styles.bulleAutre,
      memeExp && (moi ? styles.bulleGroupeMoi : styles.bulleGroupeAutre),
    ];

    const bulle = (
      <View style={[styles.msgWrap, moi ? styles.msgWrapMoi : styles.msgWrapAutre]}>
        {!moi && !memeExp && (
          <View style={styles.avatarMsg}>
            <Ionicons name="person" size={14} color={Colors.white} />
          </View>
        )}
        {!moi && memeExp && <View style={styles.avatarSpacer} />}
        {moi ? (
          <Pressable
            style={({ pressed }) => [bulleStyle, pressed && { opacity: 0.75 }]}
            onLongPress={() => confirmerSuppression(item.id, item.local)}
            delayLongPress={400}
          >
            {contenuBulle}
          </Pressable>
        ) : (
          <View style={bulleStyle}>{contenuBulle}</View>
        )}
      </View>
    );

    if (animVal) {
      return (
        <Animated.View style={{
          opacity: animVal,
          transform: [
            { translateX: animVal.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) },
            { scale: animVal.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.85, 1.04, 1] }) },
          ],
        }}>
          {bulle}
        </Animated.View>
      );
    }
    return bulle;
  };

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <Pressable
          style={styles.headerBtn}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/chat')}
          hitSlop={16}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </Pressable>

        {annonceImage ? (
          <Image source={{ uri: annonceImage }} style={styles.headerImg} resizeMode="cover" />
        ) : (
          <View style={styles.headerImgPlaceholder}>
            <Ionicons name="image-outline" size={20} color={Colors.accent} />
          </View>
        )}

        <View style={styles.headerCentre}>
          <Text style={styles.headerTitre} numberOfLines={1}>
            {titreConv.replace(/^(🚗|🏠|🛍️|🚙|🏡|🔑)\s*/u, '').trim()}
          </Text>
          <View style={styles.statutOnline}>
            <View style={styles.dotOnline} />
            <Text style={styles.txtOnline}>En ligne</Text>
          </View>
        </View>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {chargement ? (
          <View style={styles.centre}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
        ) : (
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={m => m.id}
            renderItem={renderMsg}
            contentContainerStyle={styles.liste}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.videWrap}>
                <Ionicons name="chatbubbles-outline" size={52} color={Colors.textLight} />
                <Text style={styles.videText}>Dis bonjour ! C'est le début de la conversation.</Text>
              </View>
            }
          />
        )}

        <View style={styles.saisie}>
          <TextInput
            style={styles.input}
            value={texte}
            onChangeText={setTexte}
            placeholder="Écris ton message..."
            placeholderTextColor={Colors.textLight}
            multiline
            maxLength={1000}
            onSubmitEditing={envoyer}
            blurOnSubmit={false}
          />
          <Pressable
            style={[styles.btnEnvoyer, !texte.trim() && styles.btnEnvoyerDisabled]}
            onPress={envoyer}
            disabled={!texte.trim() || envoi}
          >
            <Animated.View style={{ transform: [{ scale: sendBtnAnim }] }}>
              <Ionicons name="send" size={18} color={Colors.white} />
            </Animated.View>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 8,
  },
  headerBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerImg: { width: 42, height: 42, borderRadius: 10, marginRight: 4 },
  headerImgPlaceholder: {
    width: 42, height: 42, borderRadius: 10, marginRight: 4,
    backgroundColor: Colors.primary, borderWidth: 1, borderColor: Colors.accent + '40',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCentre: { flex: 1, alignItems: 'center' },
  headerTitre: { fontSize: 15, fontWeight: '800', color: Colors.white },
  statutOnline: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  dotOnline: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  txtOnline: { fontSize: 11, color: Colors.success, fontWeight: '600' },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  liste: { padding: 16, paddingBottom: 8, flexGrow: 1, justifyContent: 'flex-end' },
  videWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  videText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
  msgWrap: { flexDirection: 'row', marginBottom: 4, alignItems: 'flex-end' },
  msgWrapMoi:   { justifyContent: 'flex-end' },
  msgWrapAutre: { justifyContent: 'flex-start' },
  avatarMsg: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 6, flexShrink: 0,
  },
  avatarSpacer: { width: 34 },
  bulle: {
    maxWidth: '72%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  bulleMoi:          { backgroundColor: Colors.accent, borderBottomRightRadius: 4 },
  bulleAutre:        { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 4 },
  bulleGroupeMoi:    { borderBottomRightRadius: 18, marginTop: 2 },
  bulleGroupeAutre:  { borderBottomLeftRadius: 18, marginTop: 2 },
  bulleTexte:        { fontSize: 15, color: Colors.textPrimary, lineHeight: 21 },
  bulleTexteMoi:     { color: Colors.white },
  bulleDate:         { fontSize: 10, color: Colors.textLight, marginTop: 4, textAlign: 'right' },
  bulleDateMoi:      { color: 'rgba(255,255,255,0.7)' },
  saisie: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 120,
    backgroundColor: Colors.card, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: Colors.white,
    borderWidth: 1, borderColor: Colors.border,
  },
  btnEnvoyer: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  btnEnvoyerDisabled: { backgroundColor: Colors.glass, shadowOpacity: 0 },
});
