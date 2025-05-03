import { Tabs } from 'expo-router';
import { useCallback } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BookOpen, Search, CirclePlus as PlusCircle, Calendar, User } from 'lucide-react-native';

import Colors from '@/constants/Colors';
import { spacing, borderRadius, shadows } from '@/constants/Layout';

export default function TabLayout() {
  const handleTabPress = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "white",
        tabBarInactiveTintColor: Colors.nearWhite,
        tabBarStyle: {
          borderTopWidth: 0,
          height: 70,
          paddingBottom: spacing.sm,
          paddingTop: spacing.xs,
          backgroundColor: Colors.themeBrown_colors[250],
          ...shadows.medium,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 12,
          marginTop: 4,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color, size }) => (
            <View style={styles.iconContainer}>
              <BookOpen size={24} color={color} />
            </View>
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => (
            <View style={styles.iconContainer}>
              <Calendar size={24} color={color} />
            </View>
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      {/* <Tabs.Screen
        name="new-entry"
        options={{
          title: 'New Entry',
          tabBarIcon: ({ color }) => <PlusCircle size={26} color={color} />,
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      /> */}
      <Tabs.Screen
        name="new-entry"
        options={{
          title: 'New Entry',
          tabBarIcon: ({ color }) => (
            <View style={styles.addButtonContainer}>
              <View style={styles.addButton}>
                <PlusCircle color={Colors.white} size={32} />
              </View>
            </View>
          ),
          tabBarLabel: () => null,
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => (
            <View style={styles.iconContainer}>
              <Search size={24} color={color} />
            </View>
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <View style={styles.iconContainer}>
              <User size={24} color={color} />
            </View>
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgb(151 88 15)",
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.large,
    transform: [{ translateY: -10 }],
  },
});