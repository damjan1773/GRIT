import React, { useRef } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { Icon } from './Icon';

const ACTION_WIDTH = 84;

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
}

/** Swipe left to reveal a delete action. */
export function SwipeableRow({ children, onDelete }: SwipeableRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const restingAt = useRef(0);

  function snapTo(value: number) {
    restingAt.current = value;
    Animated.spring(translateX, {
      toValue: value,
      useNativeDriver: false,
      bounciness: 0,
      speed: 18,
    }).start();
  }

  const panResponder = useRef(
    PanResponder.create({
      // Only claim clearly horizontal drags, so the list still scrolls.
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderMove: (_e, g) => {
        translateX.setValue(Math.min(0, Math.max(-ACTION_WIDTH, restingAt.current + g.dx)));
      },
      onPanResponderRelease: (_e, g) => {
        const next = restingAt.current + g.dx;
        snapTo(next < -ACTION_WIDTH / 2 ? -ACTION_WIDTH : 0);
      },
      onPanResponderTerminate: () => snapTo(restingAt.current),
    })
  ).current;

  return (
    <View style={styles.wrap}>
      <View style={styles.actionLayer}>
        <Pressable
          onPress={() => {
            snapTo(0);
            onDelete();
          }}
          style={styles.deleteBtn}
        >
          <Icon name="delete" size={22} color="#101012" />
        </Pressable>
      </View>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 20, overflow: 'hidden' },
  actionLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteBtn: {
    width: ACTION_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
  },
});
