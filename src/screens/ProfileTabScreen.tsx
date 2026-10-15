import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { OnboardingScreen } from './OnboardingScreen';
import { ProfileScreen } from './ProfileScreen';
import { useAppData } from '../context/AppDataContext';

/**
 * The details are entered once: with no saved profile this is the onboarding
 * flow, and afterwards it shows the profile, which can be re-opened for edits.
 */
export function ProfileTabScreen() {
  const navigation = useNavigation<any>();
  const { profile } = useAppData();
  const [editing, setEditing] = useState(false);
  const onboarding = !profile || editing;

  // Entering details takes the whole screen — first time or editing later. The
  // steps have their own way back and forward, and the tab bar would cover the
  // "Nastavi" button on smaller phones.
  useEffect(() => {
    navigation.setOptions({ tabBarStyle: onboarding ? { display: 'none' } : undefined });
  }, [navigation, onboarding]);

  if (!profile) return <OnboardingScreen />;

  if (editing) {
    return <OnboardingScreen initialProfile={profile} onDone={() => setEditing(false)} />;
  }

  return <ProfileScreen profile={profile} onEdit={() => setEditing(true)} />;
}
