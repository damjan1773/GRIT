import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, gradientColors, gradientLocations, softGradientColors } from '../theme/colors';
import { Icon } from '../components/Icon';
import { StepperButton } from '../components/Stepper';
import { GradientButton } from '../components/GradientButton';
import { LinearGradient } from 'expo-linear-gradient';
import { ACTIVITY_LEVELS, calculateBMI, calculateBMR, calculateMacroGoals, calculateTDEE, bmiLabel } from '../utils/calculations';
import { ActivityLevel, Sex, UserProfile } from '../types';
import { useAppData } from '../context/AppDataContext';

const STEP_LABELS = ['KORAK 1 · O TEBI', 'KORAK 2 · MERE', 'KORAK 3 · AKTIVNOST', 'SPREMNO'];
const CTA_LABELS = ['Nastavi', 'Nastavi', 'Izračunaj moj cilj', 'Uđi u aplikaciju'];

export function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const { setProfile } = useAppData();

  const [step, setStep] = useState(0);
  const [sex, setSex] = useState<Sex>('f');
  const [age, setAge] = useState(28);
  const [weight, setWeight] = useState(64);
  const [height, setHeight] = useState(170);
  const [activity, setActivity] = useState<ActivityLevel>('moderate');

  const bmi = useMemo(() => calculateBMI(weight, height), [weight, height]);
  const bmr = useMemo(() => calculateBMR(weight, height, age, sex), [weight, height, age, sex]);
  const tdee = useMemo(() => calculateTDEE(bmr, activity), [bmr, activity]);
  const target = tdee;
  const macros = useMemo(() => calculateMacroGoals(target), [target]);
  const activityOption = ACTIVITY_LEVELS.find(a => a.id === activity)!;

  function next() {
    if (step >= 3) {
      const profile: UserProfile = {
        sex,
        age,
        weightKg: weight,
        heightCm: height,
        activity,
        bmr,
        tdee,
        targetCalories: target,
        macroGoals: macros,
      };
      setProfile(profile);
      navigation.navigate('Dashboard');
      return;
    }
    setStep(s => s + 1);
  }

  function back() {
    if (step > 0) setStep(s => s - 1);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={back} style={styles.backBtn}>
            <Icon name="arrow_back" size={20} color="#fff" />
          </Pressable>
          <Text style={styles.stepLabel}>{STEP_LABELS[step]}</Text>
          <Text style={styles.stepCount}>{step >= 3 ? '3/3' : `${step + 1}/3`}</Text>
        </View>
        <View style={styles.segRow}>
          {[0, 1, 2].map(i => (
            <View key={i} style={styles.segTrack}>
              <View style={[styles.segFill, { width: i <= Math.min(step, 2) ? '100%' : '0%' }]} />
            </View>
          ))}
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 20 }}>
        {step === 0 && (
          <View>
            <Text style={styles.h2}>Ko si ti?</Text>
            <Text style={styles.sub}>Nekoliko podataka je dovoljno da izračunamo tvoj dnevni cilj kalorija i makronutrijenata.</Text>
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
            <Text style={styles.sub}>Uvek možeš da ih izmeniš kasnije u profilu.</Text>
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
            <Text style={styles.sub}>Ovo najviše utiče na tvoj dnevni cilj kalorija.</Text>
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
          <View style={{ alignItems: 'center', paddingTop: 14 }}>
            <LinearGradient colors={gradientColors} locations={gradientLocations} style={styles.badge}>
              <Text style={styles.badgeText}>TVOJ DNEVNI CILJ</Text>
            </LinearGradient>
            <Text style={styles.targetValue}>{target.toLocaleString('sr-RS')}</Text>
            <Text style={styles.targetSub}>kcal na dan · Održavanje</Text>
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
            <View style={styles.calcCard}>
              <Text style={styles.calcTitle}>Kako smo izračunali</Text>
              <Text style={styles.calcDesc}>
                BMR {bmr.toLocaleString('sr-RS')} kcal (Mifflin-St Jeor) × {activityOption.multiplier} za „{activityOption.name}“ = TDEE{' '}
                {tdee.toLocaleString('sr-RS')} kcal.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton label={CTA_LABELS[step]} onPress={next} />
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
  footer: { padding: 26, paddingBottom: 34 },
});
