import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
}

/** Accepts Material-Symbols-style snake_case names (as used in the design) and
 * maps them onto the MaterialIcons glyph set used at runtime. */
export function Icon({ name, size = 20, color = '#fff' }: IconProps) {
  const glyphName = name.replace(/_/g, '-') as React.ComponentProps<typeof MaterialIcons>['name'];
  return <MaterialIcons name={glyphName} size={size} color={color} />;
}
