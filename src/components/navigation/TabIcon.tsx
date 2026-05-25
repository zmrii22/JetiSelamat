import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
  activeName: IoniconName;
  inactiveName: IoniconName;
  color: string;
  focused: boolean;
  size: number;
}

export const TabIcon = ({ activeName, inactiveName, color, focused, size }: TabIconProps) => {
  const focusProgress = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(focusProgress, {
      toValue: focused ? 1 : 0,
      friction: 7,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [focused, focusProgress]);

  const scale = focusProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });

  return (
    <View className="items-center justify-center">
      {focused ? <View className="absolute h-8 w-12 rounded-full bg-[#E2F6F3]" /> : null}
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons color={color} name={focused ? activeName : inactiveName} size={size} />
      </Animated.View>
    </View>
  );
};
