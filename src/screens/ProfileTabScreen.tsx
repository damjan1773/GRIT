import React, { useState } from 'react';
import { OnboardingScreen } from './OnboardingScreen';
import { ProfileScreen } from './ProfileScreen';
import { useAppData } from '../context/AppDataContext';

/**
 * The details are entered once: with no saved profile this is the onboarding
 * flow, and afterwards it shows the profile, which can be re-opened for edits.
 */
export function ProfileTabScreen() {
  const { profile } = useAppData();
  const [editing, setEditing] = useState(false);

  if (!profile) return <OnboardingScreen />;

  if (editing) {
    return <OnboardingScreen initialProfile={profile} onDone={() => setEditing(false)} />;
  }

  return <ProfileScreen profile={profile} onEdit={() => setEditing(true)} />;
}
