// Mapping fontWeight → fontFamily Roboto
// Utiliser avec le composant <Texte> ou la fonction ff()

export const ROBOTO: Record<string, string> = {
  '100': 'Roboto_300Light',
  '200': 'Roboto_300Light',
  '300': 'Roboto_300Light',
  '400': 'Roboto_400Regular',
  '500': 'Roboto_500Medium',
  '600': 'Roboto_600SemiBold',
  '700': 'Roboto_700Bold',
  '800': 'Roboto_800ExtraBold',
  '900': 'Roboto_900Black',
  'normal': 'Roboto_400Regular',
  'bold':   'Roboto_700Bold',
};

// Retourne { fontFamily } pour un fontWeight donné
export const ff = (poids: string | number = '400'): { fontFamily: string } => ({
  fontFamily: ROBOTO[String(poids)] ?? 'Roboto_400Regular',
});
