import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, gradientColors, gradientLocations, softGradientColors } from '../theme/colors';
import { Icon } from '../components/Icon';
import { StepperButton } from '../components/Stepper';
import { GradientButton } from '../components/GradientButton';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import {
  ACTIVITY_LEVELS,
  GOAL_ADJUSTMENT_LIMIT,
  GOAL_ADJUSTMENT_STEP,
  calculateBMI,
  calculateBMR,
  calculateMacroGoals,
  calculateTDEE,
  bmiLabel,
  estimateWeightChangeKg,
  goalLabel,
} from '../utils/calculations';
import { formatSigned } from '../utils/format';
import { ActivityLevel, Sex, UserProfile } from '../types';
import { useAppData } from '../context/AppDataContext';

const STEP_LABELS = ['KORAK 1 · O TEBI', 'KORAK 2 · MERE', 'KORAK 3 · AKTIVNOST', 'KORAK 4 · CILJ', 'SPREMNO'];
const CTA_LABELS = ['Nastavi', 'Nastavi', 'Nastavi', 'Izračunaj moj cilj', 'Uđi u aplikaciju'];
const INPUT_STEPS = 4;
const SUMMARY_STEP = INPUT_STEPS;
/** Below this a daily target is aggressive enough to warrant a nudge. */
const LOW_TARGET_KCAL = 1200;

interface OnboardingScreenProps {
  /** When given, the flow starts prefilled and acts as "edit my details". */
  initialProfile?: UserProfile | null;
  /** Called after saving (or cancelling) instead of jumping to the dashboard. */
  onDone?: () => void;
}

export function OnboardingScreen({ initialProfile, onDone }: OnboardingScreenProps = {}) {
  const navigation = useNavigation<any>();
  const { setProfile } = useAppData();
  const isEditing = !!initialProfile;

  const [step, setStep] = useState(0);
  const [name, setName] = useState(initialProfile?.name ?? '');
  const [sex, setSex] = useState<Sex>(initialProfile?.sex ?? 'f');
  const [age, setAge] = useState(initialProfile?.age ?? 28);
  const [weight, setWeight] = useState(initialProfile?.weightKg ?? 64);
  const [height, setHeight] = useState(initialProfile?.heightCm ?? 170);
  const [activity, setActivity] = useState<ActivityLevel>(initialProfile?.activity ?? 'moderate');
  const [adjustment, setAdjustment] = useState(initialProfile?.calorieAdjustment ?? 0);

  const bmi = useMemo(() => calculateBMI(weight, height), [weight, height]);
  const bmr = useMemo(() => calculateBMR(weight, height, age, sex), [weight, height, age, sex]);
  const tdee = useMemo(() => calculateTDEE(bmr, activity), [bmr, activity]);
  const target = tdee + adjustment;
  const macros = useMemo(() => calculateMacroGoals(target), [target]);
  const activityOption = ACTIVITY_LEVELS.find(a => a.id === activity)!;

  function next() {
    if (step >= SUMMARY_STEP) {
      const profile: UserProfile = {
        name: name.trim(),
        sex,
        age,
        weightKg: weight,
        heightCm: height,
        activity,
        calorieAdjustment: adjustment,
        bmr,
        tdee,
        targetCalories: target,
        macroGoals: macros,
      };
      setProfile(profile);
      if (onDone) onDone();
      else navigation.navigate('Dashboard');
      return;
    }
    setStep(s => s + 1);
  }

  function back() {
    if (step > 0) setStep(s => s - 1);
    else onDone?.();
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={back} style={styles.backBtn}>
            <Icon name="arrow_back" size={20} color="#fff" />
          </Pressable>
          <Text style={styles.stepLabel}>{STEP_LABELS[step]}</Text>
          <Text style={styles.stepCount}>{`${Math.min(step + 1, INPUT_STEPS)}/${INPUT_STEPS}`}</Text>
        </View>
        <View style={styles.segRow}>
          {Array.from({ length: INPUT_STEPS }, (_, i) => (
            <View key={i} style={styles.segTrack}>
              <View style={[styles.segFill, { width: i <= step ? '100%' : '0%' }]} />
            </View>
          ))}
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
        {step === 0 && (
          <View>
            <Text style={styles.h2}>Ko si ti?</Text>
            <Text style={styles.sub}>Nekoliko podataka je dovoljno da izračunamo tvoj dnevni cilj kalorija i makronutrijenata.</Text>
            <Text style={styles.fieldLabel}>IME</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Kako da te zovemo?"
              placeholderTextColor="rgba(255,255,255,0.3)"
              style={styles.nameInput}
              maxLength={40}
              autoCapitalize="words"
            />
            <Text style={styles.fieldLabel}>POL</Text>
            <View style={styles.sexRow}>
              {(['f', 'm'] as Sex[]).map(id => {
                const active = sex === id;
                const label = id === 'f' ? 'Žensko' : 'Muško';
                const icon = id === 'f' ? 'female' : 'male';
                return (
                  <Pressable key={id} onPress={() => setSex(id)} style={styles.sexOptionWrap}>
                    {active ? (
                      <LinearGradient colors={gradientColors} locations={gradientLocations} style={styles.sexOption}>
                        <Icon name={icon} size={26} color="#101012" />
                        <Text style={[styles.sexLabel, { color: '#101012' }]}>{label}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={[styles.sexOption, styles.sexOptionInactive]}>
                        <Icon name={icon} size={26} color="#fff" />
                        <Text style={[styles.sexLabel, { color: '#fff' }]}>{label}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.fieldLabel}>GODINE</Text>
            <View style={styles.counterCard}>
              <StepperButton icon="remove" onPress={() => setAge(a => Math.max(14, a - 1))} />
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.counterValue}>{age}</Text>
                <Text style={styles.counterUnit}>godina</Text>
              </View>
              <StepperButton icon="add" filled onPress={() => setAge(a => Math.min(90, a + 1))} />
            </View>
          </View>
        )}

        {step === 1 && (
          <View>
            <Text style={styles.h2}>Tvoje mere</Text>
            <Text style={styles.sub}>Uvek možeš da ih izmeniš kasnije na profilu.</Text>
            <View style={{ gap: 12 }}>
              <View style={styles.measureCard}>
                <Text style={styles.fieldLabel}>TEŽINA</Text>
                <View style={styles.counterRow}>
                  <StepperButton icon="remove" onPress={() => setWeight(w => Math.max(35, w - 1))} />
                  <View style={styles.measureValueRow}>
                    <Text style={[styles.measureValue, { color: colors.mint }]}>{weight}</Text>
                    <Text style={styles.measureUnit}>kg</Text>
                  </View>
                  <StepperButton icon="add" filled onPress={() => setWeight(w => Math.min(250, w + 1))} />
                </View>
              </View>
              <View style={styles.measureCard}>
                <Text style={styles.fieldLabel}>VISINA</Text>
                <View style={styles.counterRow}>
                  <StepperButton icon="remove" onPress={() => setHeight(h => Math.max(120, h - 1))} />
                  <View style={styles.measureValueRow}>
                    <Text style={[styles.measureValue, { color: colors.lav }]}>{height}</Text>
                    <Text style={styles.measureUnit}>cm</Text>
                  </View>
                  <StepperButton icon="add" filled onPress={() => setHeight(h => Math.min(220, h + 1))} />
                </View>
              </View>
              <View style={styles.bmiCard}>
                <Icon name="monitor_heart" size={20} color={colors.mint} />
                <Text style={styles.bmiText}>
                  BMI <Text style={{ color: '#fff', fontFamily: 'Poppins_700Bold' }}>{bmi.toFixed(1)}</Text> — {bmiLabel(bmi)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.h2}>Koliko se krećeš?</Text>
            <Text style={styles.sub}>Pomozi nam da procenimo tvoj nivo aktivnosti.</Text>
            <View style={{ gap: 9 }}>
              {ACTIVITY_LEVELS.map(opt => {
                const active = activity === opt.id;
                return (
                  <Pressable key={opt.id} onPress={() => setActivity(opt.id)}>
                    {active ? (
                      <LinearGradient colors={gradientColors} locations={gradientLocations} style={styles.actOption}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.actName, { color: '#101012' }]}>{opt.name}</Text>
                          <Text style={[styles.actSub, { color: 'rgba(16,16,18,0.62)' }]}>{opt.subtitle}</Text>
                        </View>
                        <Text style={[styles.actMult, { color: '#101012' }]}>×{opt.multiplier}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={[styles.actOption, styles.actOptionInactive]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.actName, { color: '#fff' }]}>{opt.name}</Text>
                          <Text style={[styles.actSub, { color: 'rgba(255,255,255,0.42)' }]}>{opt.subtitle}</Text>
                        </View>
                        <Text style={[styles.actMult, { color: '#fff' }]}>×{opt.multiplier}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={styles.h2}>Koji ti je cilj?</Text>
            <Text style={styles.sub}>
              Pomeri klizač ulevo za cut (mršavljenje) ili udesno za bulk (dobijanje mase). Nula je održavanje.
            </Text>
            <View style={styles.goalCard}>
              <Text style={styles.fieldLabel}>DNEVNA RAZLIKA</Text>
              <View style={styles.goalValueRow}>
                <Text
                  style={[styles.goalValue, { color: adjustment < 0 ? colors.lav : adjustment > 0 ? colors.mint : '#fff' }]}
                >
                  {formatSigned(adjustment)}
                </Text>
                <Text style={styles.measureUnit}>kcal</Text>
              </View>
              <Text style={styles.goalName}>{goalLabel(adjustment)}</Text>
              <Slider
                style={styles.slider}
                minimumValue={-GOAL_ADJUSTMENT_LIMIT}
                maximumValue={GOAL_ADJUSTMENT_LIMIT}
                step={GOAL_ADJUSTMENT_STEP}
                value={adjustment}
                onValueChange={v => setAdjustment(Math.round(v))}
                minimumTrackTintColor={colors.lav}
                maximumTrackTintColor={colors.mint}
                thumbTintColor="#fff"
              />
              <View style={styles.sliderEnds}>
                <Text style={styles.sliderEnd}>CUT {formatSigned(-GOAL_ADJUSTMENT_LIMIT)}</Text>
                <Text style={styles.sliderEnd}>0</Text>
                <Text style={styles.sliderEnd}>BULK {formatSigned(GOAL_ADJUSTMENT_LIMIT)}</Text>
              </View>
            </View>
            <View style={styles.estimateCard}>
              <Icon
                name={adjustment < 0 ? 'trending_down' : adjustment > 0 ? 'trending_up' : 'trending_flat'}
                size={20}
                color={colors.mint}
              />
              <Text style={styles.estimateText}>
                {adjustment === 0 ? (
                  'Održavaš trenutnu težinu.'
                ) : (
                  <>
                    <Text style={styles.estimateStrong}>{formatSigned(estimateWeightChangeKg(adjustment, 7), 2)} kg</Text>{' '}
                    nedeljno ·{' '}
                    <Text style={styles.estimateStrong}>{formatSigned(estimateWeightChangeKg(adjustment, 30), 1)} kg</Text>{' '}
                    mesečno
                  </>
                )}
              </Text>
            </View>
            <Text style={styles.estimateNote}>
              Dnevni cilj: {target.toLocaleString('sr-RS')} kcal. Procena — stvarna promena zavisi od organizma i doslednosti.
            </Text>
            {target < LOW_TARGET_KCAL && (
              <Text style={styles.lowWarning}>
                Cilj od {target.toLocaleString('sr-RS')} kcal je ispod {LOW_TARGET_KCAL.toLocaleString('sr-RS')} kcal dnevno —
                razmisli o manjem deficitu.
              </Text>
            )}
          </View>
        )}

        {step === SUMMARY_STEP && (
          <View style={{ alignItems: 'center', paddingTop: 14 }}>
            <LinearGradient colors={gradientColors} locations={gradientLocations} style={styles.badge}>
              <Text style={styles.badgeText}>TVOJ DNEVNI CILJ</Text>
            </LinearGradient>
            <Text style={styles.targetValue}>{target.toLocaleString('sr-RS')}</Text>
            <Text style={styles.targetSub}>kcal na dan · {goalLabel(adjustment)}</Text>
            <View style={styles.macroRow}>
              <View style={[styles.macroBox, { backgroundColor: colors.mint }]}>
                <Text style={styles.macroValue}>{macros.protein}g</Text>
                <Text style={styles.macroLabel}>Proteini</Text>
              </View>
              <View style={[styles.macroBox, { backgroundColor: colors.lav }]}>
                <Text style={styles.macroValue}>{macros.carbs}g</Text>
                <Text style={styles.macroLabel}>Ugljeni h.</Text>
              </View>
              <View style={[styles.macroBox, { backgroundColor: '#fff' }]}>
                <Text style={styles.macroValue}>{macros.fats}g</Text>
                <Text style={styles.macroLabel}>Masti</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton
          label={isEditing && step === SUMMARY_STEP ? 'Sačuvaj izmene' : CTA_LABELS[step]}
          onPress={next}
          disabled={step === 0 && !name.trim()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { paddingTop: 62, paddingHorizontal: 26 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 10.5, letterSpacing: 2, color: 'rgba(255,255,255,0.42)' },
  stepCount: { fontFamily: 'Poppins_700Bold', fontSize: 12, color: colors.mint, minWidth: 40, textAlign: 'right' },
  segRow: { flexDirection: 'row', gap: 7 },
  segTrack: { flex: 1, height: 5, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.09)', overflow: 'hidden' },
  segFill: { height: '100%', borderRadius: 99, backgroundColor: colors.mint },
  body: { flex: 1, paddingHorizontal: 26, paddingTop: 26 },
  h2: { fontFamily: 'Poppins_900Black_Italic', fontSize: 34, color: '#fff', letterSpacing: -0.3 },
  sub: { fontFamily: 'Poppins_400Regular', fontSize: 13.5, lineHeight: 21, color: 'rgba(255,255,255,0.5)', marginTop: 10, marginBottom: 26 },
  fieldLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.38)', marginBottom: 11 },
  nameInput: {
    backgroundColor: '#17171A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 26,
    color: '#fff',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
  },
  sexRow: { flexDirection: 'row', gap: 11, marginBottom: 26 },
  sexOptionWrap: { flex: 1 },
  sexOption: { padding: 20, borderRadius: 24, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.09)' },
  sexOptionInactive: { backgroundColor: '#17171A' },
  sexLabel: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 17, marginTop: 9 },
  counterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#17171A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  counterValue: { fontFamily: 'Poppins_900Black_Italic', fontSize: 42, color: '#fff' },
  counterUnit: { fontFamily: 'Poppins_500Medium', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 },
  measureCard: { padding: 18, borderRadius: 26, backgroundColor: '#17171A', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  measureValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  measureValue: { fontFamily: 'Poppins_900Black_Italic', fontSize: 40 },
  measureUnit: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 15, color: 'rgba(255,255,255,0.45)', marginLeft: 5 },
  bmiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 22,
    backgroundColor: 'rgba(143,233,206,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(143,233,206,0.18)',
  },
  bmiText: { fontFamily: 'Poppins_500Medium', fontSize: 12.5, color: 'rgba(255,255,255,0.72)', flex: 1 },
  actOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 15,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  actOptionInactive: { backgroundColor: '#17171A' },
  actName: { fontFamily: 'Poppins_800ExtraBold_Italic', fontSize: 15 },
  actSub: { fontFamily: 'Poppins_400Regular', fontSize: 11.5, marginTop: 2 },
  actMult: { fontFamily: 'Poppins_700Bold', fontSize: 11, opacity: 0.72 },
  badge: { paddingHorizontal: 13, paddingVertical: 6, borderRadius: 99 },
  badgeText: { fontFamily: 'Poppins_600SemiBold', fontSize: 10.5, letterSpacing: 2, color: '#101012' },
  targetValue: { fontFamily: 'Poppins_900Black_Italic', fontSize: 72, color: colors.mint, marginTop: 20 },
  targetSub: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6 },
  macroRow: { flexDirection: 'row', gap: 8, marginTop: 26, alignSelf: 'stretch' },
  macroBox: { flex: 1, paddingVertical: 14, paddingHorizontal: 10, borderRadius: 20, alignItems: 'center' },
  macroValue: { fontFamily: 'Poppins_900Black_Italic', fontSize: 21, color: '#101012' },
  macroLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 10.5, color: '#101012', opacity: 0.68, marginTop: 4 },
  calcCard: {
    marginTop: 16,
    padding: 15,
    borderRadius: 22,
    backgroundColor: '#17171A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    alignSelf: 'stretch',
  },
  calcTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, color: '#fff', marginBottom: 6 },
  calcDesc: { fontFamily: 'Poppins_400Regular', fontSize: 11.5, lineHeight: 18, color: 'rgba(255,255,255,0.45)' },
  goalCard: {
    padding: 18,
    borderRadius: 26,
    backgroundColor: '#17171A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  goalValueRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginTop: 4 },
  goalValue: { fontFamily: 'Poppins_900Black_Italic', fontSize: 48, letterSpacing: -1 },
  goalName: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 2 },
  slider: { width: '100%', height: 40, marginTop: 14 },
  sliderEnds: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  sliderEnd: { fontFamily: 'Poppins_600SemiBold', fontSize: 10, letterSpacing: 1, color: 'rgba(255,255,255,0.38)' },
  estimateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    padding: 14,
    borderRadius: 22,
    backgroundColor: 'rgba(143,233,206,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(143,233,206,0.18)',
  },
  estimateText: { flex: 1, fontFamily: 'Poppins_500Medium', fontSize: 13, color: 'rgba(255,255,255,0.72)' },
  estimateStrong: { fontFamily: 'Poppins_700Bold', color: '#fff' },
  estimateNote: { fontFamily: 'Poppins_400Regular', fontSize: 11.5, lineHeight: 17, color: 'rgba(255,255,255,0.4)', marginTop: 10 },
  lowWarning: { fontFamily: 'Poppins_500Medium', fontSize: 12, lineHeight: 18, color: '#FF6B6B', marginTop: 10 },
  footer: { padding: 26, paddingBottom: 34 },
});
