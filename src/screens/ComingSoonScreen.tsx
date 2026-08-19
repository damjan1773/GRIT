import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, softGradientColors } from '../theme/colors';
import { Icon } from '../components/Icon';
import { GradientButton } from '../components/GradientButton';

export function ComingSoonScreen({ label, icon }: { label: string; icon: string }) {
  const navigation = useNavigation<any>();
  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Icon name={icon} size={42} color={colors.mint} />
        </View>
        <Text style={styles.title}>{label}</Text>
        <Text style={styles.desc}>Ovaj ekran nije deo prve faze prototipa. Sledeći na redu posle nutricije.</Text>
        <GradientButton
          label="Vrati se na dnevnik"
          onPress={() => navigation.navigate('Dashboard')}
          height={52}
          style={styles.cta}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 34 },
  content: { alignItems: 'center' },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 34,
    backgroundColor: softGradientColors[0],
    borderWidth: 1,
    borderColor: 'rgba(143,233,206,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: { fontFamily: 'Poppins_900Black_Italic', fontSize: 28, color: '#fff', textAlign: 'center' },
  desc: { fontFamily: 'Poppins_400Regular', fontSize: 13.5, lineHeight: 21, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginTop: 12, marginBottom: 26 },
  cta: { minWidth: 220 },
});
