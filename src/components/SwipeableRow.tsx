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
  const currentX = useRef(0);

  function snapTo(value: number) {
    restingAt.current = value;
    currentX.current = value;
    Animated.spring(translateX, {
      toValue: value,
      useNativeDriver: false,
      bounciness: 0,
      speed: 18,
    }).start();
  }

  // Past the halfway point the row stays open on the delete action.
  function settle() {
    snapTo(currentX.current < -ACTION_WIDTH / 2 ? -ACTION_WIDTH : 0);
  }

  const panResponder = useRef(
    PanResponder.create({
      // Only claim clearly horizontal drags, so the list still scrolls.
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      // Keep the swipe once it has started; otherwise the surrounding
      // ScrollView takes the gesture on release and the row springs shut.
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_e, g) => {
        currentX.current = Math.min(0, Math.max(-ACTION_WIDTH, restingAt.current + g.dx));
        translateX.setValue(currentX.current);
      },
      onPanResponderRelease: settle,
      // Native scrolling can still cancel the touch outright — settle where the
      // finger stopped rather than falling back to the closed position.
      onPanResponderTerminate: settle,
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
