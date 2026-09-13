import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradientColors, gradientLocations } from '../theme/colors';
import { Icon } from '../components/Icon';
import { parseMealFromText } from '../services/mealParser';
import { MealParseItem } from '../services/mealParser.types';
import { useAppData } from '../context/AppDataContext';
import { createMealId } from '../services/storage';
import { forDay } from '../utils/dates';

type ChatMessage =
  | { id: string; kind: 'bot'; text: string }
  | { id: string; kind: 'user'; text: string }
  | { id: string; kind: 'typing' }
  | { id: string; kind: 'card'; items: MealParseItem[]; pending: boolean; locked: boolean };

const SUGGESTION_CHIPS = ['grčki jogurt i banana', '150g piletine i riža', 'proteinski šejk', 'dve kriške pice'];

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `msg_${idCounter}`;
}

function itemTotal(item: MealParseItem) {
  return {
    calories: Math.round(item.unitCalories * item.qty),
    protein: Math.round(item.unitProtein * item.qty),
    carbs: Math.round(item.unitCarbs * item.qty),
    fats: Math.round(item.unitFats * item.qty),
  };
}

function cardTotals(items: MealParseItem[]) {
  return items.reduce(
    (acc, it) => {
      const t = itemTotal(it);
      return { calories: acc.calories + t.calories, protein: acc.protein + t.protein, carbs: acc.carbs + t.carbs, fats: acc.fats + t.fats };
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );
}

export function MealEntryScreen() {
  const navigation = useNavigation<any>();
  const { profile, todayKey, selectedDateKey, dayMeals, addMeal } = useAppData();
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: nextId(), kind: 'bot', text: 'Zdravo. Napiši svojim rečima šta si jeo i izračunaću kalorije i makronutrijente. Što detaljnije napišeš šta si pojeo/la to ću preciznije izračunati.' },
  ]);
  const [input, setInput] = useState('');

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [messages]);

  const isToday = selectedDateKey === todayKey;
  const consumed = dayMeals.reduce((sum, m) => sum + m.calories, 0);

  async function handleSend(rawText?: string) {
    const text = (rawText ?? input).trim();
    if (!text) return;
    setInput('');
    const typingId = nextId();
    setMessages(prev => [...prev, { id: nextId(), kind: 'user', text }, { id: typingId, kind: 'typing' }]);

    const result = await parseMealFromText(text);

    setMessages(prev => {
      const withoutTyping = prev.filter(m => m.id !== typingId);
      return [...withoutTyping, { id: nextId(), kind: 'card', items: result.items, pending: true, locked: false }];
    });
  }

  function changeQty(messageId: string, itemIndex: number, delta: number) {
    setMessages(prev =>
      prev.map(m => {
        if (m.id !== messageId || m.kind !== 'card') return m;
        const items = m.items.map((it, i) => (i === itemIndex ? { ...it, qty: Math.max(1, it.qty + delta) } : it));
        return { ...m, items };
      })
    );
  }

  function dismissCard(messageId: string) {
    setMessages(prev => [
      ...prev.filter(m => m.id !== messageId),
      { id: nextId(), kind: 'bot', text: 'Odbacio sam to. Napiši ponovo drugačije ako želiš.' },
    ]);
  }

  async function saveCard(messageId: string) {
    const message = messages.find(m => m.id === messageId);
    if (!message || message.kind !== 'card') return;
    const totals = cardTotals(message.items);
    const meal = {
      id: createMealId(),
      name: message.items.map(it => it.name).join(' + '),
      calories: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      fats: totals.fats,
      timestamp: Date.now(),
      dateKey: selectedDateKey,
    };
    await addMeal(meal);

    const target = profile?.targetCalories ?? 0;
    const left = Math.max(0, target - (consumed + totals.calories));

    setMessages(prev =>
      prev.map(m => (m.id === messageId && m.kind === 'card' ? { ...m, pending: false, locked: true } : m)).concat([
        {
          id: nextId(),
          kind: 'bot',
          text: `Upisano: ${totals.calories.toLocaleString('sr-RS')} kcal. Ostalo ti je ${left.toLocaleString('sr-RS')} kcal ${forDay(selectedDateKey, todayKey)}.`,
        },
      ])
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      <View style={styles.header}>
        <Pressable onPress={() => navigation.navigate('Dashboard')} style={styles.backBtn}>
          <Icon name="arrow_back" size={19} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Brzi unos</Text>
          {/* Off today, say so loudly — it's where the meal will be saved. */}
          <Text style={[styles.headerSub, !isToday && { color: colors.mint }]}>
            {isToday ? 'piši prirodnim jezikom' : `unos ${forDay(selectedDateKey, todayKey)}`}
          </Text>
        </View>
        <LinearGradient colors={gradientColors} locations={gradientLocations} style={styles.kcalBadge}>
          <Text style={styles.kcalBadgeText}>{Math.round(consumed).toLocaleString('sr-RS')} kcal</Text>
        </LinearGradient>
      </View>

      <ScrollView ref={scrollRef} style={styles.chatArea} contentContainerStyle={{ padding: 18, gap: 13 }}>
        {messages.map(message => {
          if (message.kind === 'bot') {
            return (
              <View key={message.id} style={styles.botBubble}>
                <Text style={styles.botText}>{message.text}</Text>
              </View>
            );
          }
          if (message.kind === 'user') {
            return (
              <LinearGradient key={message.id} colors={gradientColors} locations={gradientLocations} style={styles.userBubble}>
                <Text style={styles.userText}>{message.text}</Text>
              </LinearGradient>
            );
          }
          if (message.kind === 'typing') {
            return (
              <View key={message.id} style={styles.typingBubble}>
                <View style={[styles.typingDot, { backgroundColor: colors.mint }]} />
                <View style={[styles.typingDot, { backgroundColor: colors.mid }]} />
                <View style={[styles.typingDot, { backgroundColor: colors.lav }]} />
              </View>
            );
          }
          // card
          const totals = cardTotals(message.items);
          return (
            <View key={message.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <LinearGradient colors={gradientColors} locations={gradientLocations} style={styles.cardIcon}>
                  <Icon name="auto_awesome" size={16} color="#101012" />
                </LinearGradient>
                <Text style={styles.cardTitle}>Razloženo</Text>
                <Text style={styles.cardBadge}>{message.locked ? 'sačuvano' : 'procena'}</Text>
              </View>

              {message.items.map((item, index) => {
                const t = itemTotal(item);
                return (
                  <View key={`${message.id}_${index}`} style={styles.itemRow}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.itemMacro}>
                        {t.protein}g P · {t.carbs}g U · {t.fats}g M
                      </Text>
                    </View>
                    {message.pending ? (
                      <View style={styles.qtyControls}>
                        <Pressable onPress={() => changeQty(message.id, index, -1)} style={styles.qtyBtn}>
                          <Icon name="remove" size={15} color="#fff" />
                        </Pressable>
                        <Text style={styles.qtyLabel}>
                          {item.qty} {item.unitLabel}
                        </Text>
                        <Pressable onPress={() => changeQty(message.id, index, 1)} style={styles.qtyBtn}>
                          <Icon name="add" size={15} color="#fff" />
                        </Pressable>
                      </View>
                    ) : (
                      <Text style={styles.qtyLabelLocked}>
                        {item.qty} {item.unitLabel}
                      </Text>
                    )}
                    <Text style={styles.itemKcal}>{t.calories}</Text>
                  </View>
                );
              })}

              <View style={styles.totalsRow}>
                <View style={[styles.totalBox, { flex: 1.15, backgroundColor: '#fff' }]}>
                  <Text style={styles.totalValue}>{totals.calories}</Text>
                  <Text style={styles.totalLabel}>KCAL</Text>
                </View>
                <View style={[styles.totalBox, { backgroundColor: colors.mint }]}>
                  <Text style={styles.totalValue}>{totals.protein}</Text>
                  <Text style={styles.totalLabel}>PROT</Text>
                </View>
                <View style={[styles.totalBox, { backgroundColor: colors.lav }]}>
                  <Text style={styles.totalValue}>{totals.carbs}</Text>
                  <Text style={styles.totalLabel}>UGLJ</Text>
                </View>
                <View style={[styles.totalBox, styles.totalBoxOutline]}>
                  <Text style={[styles.totalValue, { color: '#fff' }]}>{totals.fats}</Text>
                  <Text style={[styles.totalLabel, { color: 'rgba(255,255,255,0.5)' }]}>MASTI</Text>
                </View>
              </View>

              {message.pending ? (
                <>
                  <View style={styles.actionsRow}>
                    <Pressable onPress={() => saveCard(message.id)} style={{ flex: 1 }}>
                      <LinearGradient colors={gradientColors} locations={gradientLocations} style={styles.saveBtn}>
                        <Text style={styles.saveBtnText}>Sačuvaj u dnevnik</Text>
                      </LinearGradient>
                    </Pressable>
                    <Pressable onPress={() => dismissCard(message.id)} style={styles.dismissBtn}>
                      <Icon name="close" size={20} color="rgba(255,255,255,0.6)" />
                    </Pressable>
                  </View>
                  <Text style={styles.hint}>Podesi količine strelicama pre čuvanja</Text>
                </>
              ) : (
                <View style={styles.savedRow}>
                  <Icon name="check_circle" size={17} color={colors.mint} />
                  <Text style={styles.savedText}>Sačuvano u dnevnik</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {SUGGESTION_CHIPS.map(chip => (
            <Pressable key={chip} onPress={() => handleSend(chip)} style={styles.chip}>
              <Text style={styles.chipText}>{chip}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => handleSend()}
            placeholder="Šta si pojeo?"
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={styles.input}
          />
          <Pressable onPress={() => handleSend()}>
            <LinearGradient colors={gradientColors} locations={gradientLocations} style={styles.sendBtn}>
              <Icon name="arrow_upward" size={23} color="#101012" />
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingTop: 58,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: { width: 38, height: 38, borderRadius: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 16, color: '#fff' },
  headerSub: { fontFamily: 'Poppins_400Regular', fontSize: 11.5, color: 'rgba(255,255,255,0.42)', marginTop: 1 },
  kcalBadge: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 99 },
  kcalBadgeText: { fontFamily: 'Poppins_700Bold', fontSize: 10.5, color: '#101012' },
  chatArea: { flex: 1 },
  botBubble: {
    maxWidth: '82%',
    padding: 13,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderBottomLeftRadius: 7,
    backgroundColor: '#17171A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    alignSelf: 'flex-start',
  },
  botText: { fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 20, color: 'rgba(255,255,255,0.82)' },
  userBubble: { maxWidth: '82%', padding: 13, paddingHorizontal: 16, borderRadius: 22, borderTopRightRadius: 7, alignSelf: 'flex-end' },
  userText: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, lineHeight: 19, color: '#101012' },
  typingBubble: {
    flexDirection: 'row',
    gap: 5,
    padding: 15,
    paddingHorizontal: 17,
    borderRadius: 22,
    borderBottomLeftRadius: 7,
    backgroundColor: '#17171A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    alignSelf: 'flex-start',
  },
  typingDot: { width: 7, height: 7, borderRadius: 4 },
  card: { borderRadius: 26, backgroundColor: '#17171A', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 12 },
  cardIcon: { width: 27, height: 27, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 14, color: '#fff' },
  cardBadge: { marginLeft: 'auto', fontFamily: 'Poppins_500Medium', fontSize: 10.5, color: 'rgba(255,255,255,0.36)' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  itemName: { fontFamily: 'Poppins_600SemiBold', fontSize: 12.5, color: '#fff' },
  itemMacro: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 2 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  qtyBtn: { width: 28, height: 28, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  qtyLabel: { minWidth: 54, textAlign: 'center', fontFamily: 'Poppins_700Bold', fontSize: 11.5, color: colors.mint },
  qtyLabelLocked: { fontFamily: 'Poppins_600SemiBold', fontSize: 11.5, color: 'rgba(255,255,255,0.5)' },
  itemKcal: { width: 50, textAlign: 'right', fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 13.5, color: '#fff' },
  totalsRow: { flexDirection: 'row', gap: 7, marginTop: 14 },
  totalBox: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 18, alignItems: 'flex-start' },
  totalBoxOutline: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  totalValue: { fontFamily: 'Poppins_900Black_Italic', fontSize: 19, color: '#101012' },
  totalLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 9.5, letterSpacing: 1, opacity: 0.6, color: '#101012', marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: 9, marginTop: 15 },
  saveBtn: { height: 48, borderRadius: 99, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 14, color: '#101012' },
  dismissBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { fontFamily: 'Poppins_400Regular', fontSize: 10.5, lineHeight: 16, color: 'rgba(255,255,255,0.3)', marginTop: 10, textAlign: 'center' },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 13 },
  savedText: { fontFamily: 'Poppins_700Bold', fontSize: 12, color: colors.mint },
  footer: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 12, paddingBottom: 10, paddingHorizontal: 18 },
  chipsRow: { gap: 8, paddingBottom: 11 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)' },
  chipText: { fontFamily: 'Poppins_500Medium', fontSize: 11.5, color: 'rgba(255,255,255,0.68)' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#17171A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 99,
    paddingLeft: 17,
    paddingVertical: 6,
    paddingRight: 6,
  },
  input: { flex: 1, minWidth: 0, color: '#fff', fontFamily: 'Poppins_500Medium', fontSize: 13.5, paddingVertical: 6 },
  sendBtn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
});
