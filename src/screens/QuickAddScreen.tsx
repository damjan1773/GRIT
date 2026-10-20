import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradientColors, gradientLocations } from '../theme/colors';
import { Theme } from '../theme/theme';
import { useThemedStyles } from '../theme/ThemeContext';
import { DetailHeader } from '../components/DetailHeader';
import { Icon } from '../components/Icon';
import { IconBadge } from '../components/IconBadge';
import { SwipeableRow } from '../components/SwipeableRow';
import { useAppData } from '../context/AppDataContext';
import { FavoriteMeal } from '../types';
import { forDay } from '../utils/dates';

/** "Ovsene pahuljice + banana" — names come from the chat in lower case. */
function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

interface QuickAddScreenProps {
  onBack: () => void;
  /** Called once a kept meal has been logged. */
  onAdded: () => void;
}

/**
 * The meals kept for quick entry. A tap logs one to the selected day as it was
 * saved — no typing, no model call. Swipe left to drop one from the list.
 */
export function QuickAddScreen({ onBack, onAdded }: QuickAddScreenProps) {
  const styles = useThemedStyles(makeStyles);
  const { favorites, logFavorite, removeFavorite, selectedDateKey, todayKey } = useAppData();

  async function add(favorite: FavoriteMeal) {
    await logFavorite(favorite);
    onAdded();
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <DetailHeader
        title="Brzi unos"
        subtitle={`Obroci koje često jedeš. Dodir ga upisuje ${forDay(selectedDateKey, todayKey)}.`}
        onBack={onBack}
      />

      {favorites.length === 0 ? (
        <View style={styles.emptyCard}>
          <IconBadge symbol="star.fill" icon="star" hue="yellow" size={44} iconSize={36} />
          <Text style={styles.emptyTitle}>Još nema sačuvanih obroka</Text>
          <Text style={styles.emptyText}>
            Otvori neki obrok iz liste „Današnji obroci“ i dodirni „Dodaj u brzi unos“. Posle ga ovde dodaješ jednim
            dodirom.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {favorites.map(favorite => (
            <SwipeableRow key={favorite.id} onDelete={() => removeFavorite(favorite.id)}>
              <Pressable
                onPress={() => add(favorite)}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
                accessibilityRole="button"
                accessibilityLabel={`Dodaj ${favorite.name}, ${Math.round(favorite.calories)} kcal`}
                accessibilityHint="Prevuci ulevo da ga ukloniš iz brzog unosa"
              >
                <IconBadge symbol="star.fill" icon="star" hue="yellow" size={38} iconSize={30} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.name} numberOfLines={2}>
                    {capitalize(favorite.name)}
                  </Text>
                  <Text style={styles.meta}>
                    {Math.round(favorite.calories)} kcal · {favorite.protein}g P · {favorite.carbs}g U · {favorite.fats}g M
                  </Text>
                </View>
                <LinearGradient colors={gradientColors} locations={gradientLocations} style={styles.addBtn}>
                  <Icon name="add" size={20} color="#101012" />
                </LinearGradient>
              </Pressable>
            </SwipeableRow>
          ))}
          <Text style={styles.hint}>Prevuci obrok ulevo da ga ukloniš iz brzog unosa.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg },
    content: { paddingTop: 62, paddingHorizontal: 22, paddingBottom: 32 },
    list: { marginTop: 20, gap: 9 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 13,
      borderRadius: 20,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.ink(0.06),
    },
    name: { fontFamily: 'Poppins_600SemiBold', fontSize: 13.5, color: t.text },
    meta: { fontFamily: 'Poppins_400Regular', fontSize: 11.5, color: t.ink(0.45), marginTop: 2 },
    addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    hint: { fontFamily: 'Poppins_400Regular', fontSize: 11.5, color: t.ink(0.4), textAlign: 'center', marginTop: 6 },
    emptyCard: {
      marginTop: 22,
      padding: 22,
      borderRadius: 24,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.ink(0.07),
      alignItems: 'center',
      gap: 8,
    },
    emptyTitle: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: t.text, marginTop: 4 },
    emptyText: { fontFamily: 'Poppins_400Regular', fontSize: 12.5, lineHeight: 19, color: t.ink(0.5), textAlign: 'center' },
  });
