import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { Colors } from '../../config/colors';

const W = 50, H = 28, THUMB = 22, PAD = 3;

export function ToggleDispo({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: value ? 1 : 0,
      tension: 180, friction: 8, useNativeDriver: false,
    }).start();
  }, [value]);

  const bgColor = anim.interpolate({ inputRange: [0, 1], outputRange: [Colors.border, Colors.success] });
  const thumbX  = anim.interpolate({ inputRange: [0, 1], outputRange: [PAD, W - THUMB - PAD] });

  return (
    <Pressable onPress={() => onChange(!value)} hitSlop={8}>
      <Animated.View style={[styles.track, { backgroundColor: bgColor }]}>
        <Animated.View style={[styles.thumb, { transform: [{ translateX: thumbX }] }]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: W, height: H, borderRadius: H / 2, justifyContent: 'center' },
  thumb: {
    width: THUMB, height: THUMB, borderRadius: THUMB / 2,
    backgroundColor: Colors.white,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 4, elevation: 3,
  },
});
