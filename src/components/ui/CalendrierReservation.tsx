import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Colors } from '../../config/colors';

type MarkedDates = Record<string, any>;

type Props = {
  dateDebut: string | null;
  dateFin: string | null;
  onSelectDebut: (date: string) => void;
  onSelectFin: (date: string) => void;
  datesBloquees?: string[];  // dates déjà réservées
};

export default function CalendrierReservation({
  dateDebut,
  dateFin,
  onSelectDebut,
  onSelectFin,
  datesBloquees = [],
}: Props) {
  const aujourd_hui = new Date().toISOString().split('T')[0];

  const markedDates: MarkedDates = useMemo(() => {
    const marks: MarkedDates = {};

    // Dates bloquées (déjà réservées)
    datesBloquees.forEach(d => {
      marks[d] = { disabled: true, disableTouchEvent: true, marked: true, dotColor: Colors.error };
    });

    if (!dateDebut && !dateFin) return marks;

    // Colorier la plage entre début et fin
    if (dateDebut && dateFin && dateDebut <= dateFin) {
      let courant = new Date(dateDebut);
      const fin = new Date(dateFin);
      while (courant <= fin) {
        const str = courant.toISOString().split('T')[0];
        if (str === dateDebut && str === dateFin) {
          marks[str] = { selected: true, selectedColor: Colors.accent };
        } else if (str === dateDebut) {
          marks[str] = {
            selected: true, startingDay: true,
            color: Colors.accent, textColor: Colors.white,
          };
        } else if (str === dateFin) {
          marks[str] = {
            selected: true, endingDay: true,
            color: Colors.accent, textColor: Colors.white,
          };
        } else {
          marks[str] = {
            selected: true,
            color: 'rgba(232,119,34,0.25)',
            textColor: Colors.white,
          };
        }
        courant.setDate(courant.getDate() + 1);
      }
    } else if (dateDebut) {
      marks[dateDebut] = { selected: true, selectedColor: Colors.accent };
    }

    return marks;
  }, [dateDebut, dateFin, datesBloquees]);

  const handleJour = (day: DateData) => {
    const date = day.dateString;
    if (date < aujourd_hui) return;

    if (!dateDebut || (dateDebut && dateFin)) {
      // Nouveau choix : sélectionner début
      onSelectDebut(date);
      onSelectFin('');
    } else {
      // Début déjà sélectionné : choisir fin
      // La fin doit être APRÈS le début, et la période ne doit pas
      // chevaucher une date déjà réservée → sinon on recommence au jour choisi.
      const chevauche = datesBloquees.some(d => d > dateDebut && d <= date);
      if (date <= dateDebut || chevauche) {
        onSelectDebut(date);
        onSelectFin('');
      } else {
        onSelectFin(date);
      }
    }
  };

  return (
    <View style={styles.conteneur}>
      {/* Légende */}
      <View style={styles.legende}>
        <View style={styles.legendeItem}>
          <View style={[styles.legendePuce, { backgroundColor: Colors.accent }]} />
          <Text style={styles.legendeTxt}>Arrivée / Départ</Text>
        </View>
        <View style={styles.legendeItem}>
          <View style={[styles.legendePuce, { backgroundColor: 'rgba(232,119,34,0.25)' }]} />
          <Text style={styles.legendeTxt}>Période sélectionnée</Text>
        </View>
      </View>

      <Calendar
        markingType="period"
        markedDates={markedDates}
        onDayPress={handleJour}
        minDate={aujourd_hui}
        enableSwipeMonths
        theme={{
          backgroundColor:            Colors.card,
          calendarBackground:         Colors.card,
          textSectionTitleColor:      Colors.textSecondary,
          selectedDayBackgroundColor: Colors.accent,
          selectedDayTextColor:       Colors.white,
          todayTextColor:             Colors.accent,
          dayTextColor:               Colors.white,
          textDisabledColor:          'rgba(255,255,255,0.2)',
          arrowColor:                 Colors.accent,
          monthTextColor:             Colors.white,
          indicatorColor:             Colors.accent,
          textDayFontWeight:          '600',
          textMonthFontWeight:        '800',
          textDayHeaderFontWeight:    '700',
          textDayFontSize:            14,
          textMonthFontSize:          16,
          textDayHeaderFontSize:      12,
        }}
      />

      {/* Rappel étape */}
      {!dateDebut && (
        <Text style={styles.aide}>Sélectionne la date d'arrivée</Text>
      )}
      {dateDebut && !dateFin && (
        <Text style={styles.aide}>Maintenant sélectionne la date de départ</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  legende: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  legendeItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendePuce: { width: 12, height: 12, borderRadius: 3 },
  legendeTxt:  { fontSize: 12, color: Colors.textSecondary },
  aide: {
    textAlign: 'center',
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '600',
    paddingVertical: 10,
    paddingBottom: 14,
  },
});
