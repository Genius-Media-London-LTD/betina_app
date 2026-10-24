import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from '../theme';

type Props = {
  /** 0..1 */
  progress: number;
  height?: number;
  delay?: number;
  /** Number of segments (urban look: 20, 24 on the splash). */
  segments?: number;
  /** On a lime surface: black filled squares on a darker lime track. */
  onLime?: boolean;
};

/** Segmented XP bar — lime squares fill up one after another. */
export default function XPBar({ progress, height = 8, delay = 300, segments = 20, onLime = false }: Props) {
  const target = Math.round(Math.max(0, Math.min(1, progress)) * segments);
  const [filled, setFilled] = useState(0);

  useEffect(() => {
    setFilled(0);
    if (target === 0) return;
    let n = 0;
    let tick: ReturnType<typeof setInterval> | undefined;
    const start = setTimeout(() => {
      tick = setInterval(() => {
        n += 1;
        setFilled(n);
        if (n >= target && tick) clearInterval(tick);
      }, 40);
    }, delay);
    return () => {
      clearTimeout(start);
      if (tick) clearInterval(tick);
    };
  }, [target, delay]);

  return (
    <View style={styles.row}>
      {Array.from({ length: segments }, (_, i) => (
        <View key={i} style={[styles.seg, { height }, onLime && styles.segLime, i < filled && (onLime ? styles.onLime : styles.on)]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2, width: '100%' },
  seg: { flex: 1, backgroundColor: Colors.line },
  on: { backgroundColor: Colors.primary },
  segLime: { backgroundColor: Colors.primaryDim },
  onLime: { backgroundColor: Colors.black },
});
