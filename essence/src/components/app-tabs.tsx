import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Glass, Palette } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Palette.glow,
        tabBarInactiveTintColor: Palette.inkMid,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          elevation: 0,
          height: Platform.OS === 'ios' ? 92 : 84,
          paddingTop: 8,
        },
        tabBarBackground: () => <TabBarBackground />,
        tabBarLabelStyle: {
          fontSize: 10,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          fontWeight: '600',
        },
        tabBarItemStyle: {
          paddingVertical: 6,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'book' : 'book-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="generate"
        options={{
          title: 'Generate',
          tabBarActiveTintColor: Palette.ember,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'sparkles' : 'sparkles-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'settings' : 'settings-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

/**
 * Tab bar background: solid-dark fill with a hairline top border and a subtle
 * light sheen along the top edge. Gives the "floating panel" look without
 * needing any blur.
 */
function TabBarBackground() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: 'rgba(11, 13, 18, 0.96)' },
        ]}
      />
      <View
        style={[
          styles.topSheen,
          { backgroundColor: Glass.sheenCool },
        ]}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: Glass.borderCool,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.8,
  },
});