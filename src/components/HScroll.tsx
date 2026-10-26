// A row of cards or chips: swiped sideways on a phone, wrapped into lines on
// a desktop browser (a mouse can't swipe a carousel).
import React from 'react';
import { ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import { useDesktop } from '../lib/layout';

export default function HScroll({ contentContainerStyle, children }: { contentContainerStyle?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  const desktop = useDesktop();
  if (desktop) return <View style={[{ flexDirection: 'row', flexWrap: 'wrap' }, contentContainerStyle]}>{children}</View>;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={contentContainerStyle}>
      {children}
    </ScrollView>
  );
}
