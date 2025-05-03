import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Settings, LogOut, CreditCard as Edit } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/Colors';
import { spacing, typography, borderRadius } from '@/constants/Layout';
import { FontAwesome5 } from '@expo/vector-icons';

interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  updated_at: string;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/auth/sign-in');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const menuItems = [
    {
      title: 'Account Settings',
      icon: Settings,
      onPress: () => router.push('/settings/account'),
    },
    {
      title: 'Edit Profile',
      icon: Edit,
      onPress: () => router.push('/settings/profile'),
    },
    {
      title: 'Sign Out',
      icon: LogOut,
      onPress: handleSignOut,
      danger: true,
    },
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={{
        uri: 'https://ynxmsntmoccpldagoxrh.supabase.co/storage/v1/object/public/memoireapp/default-user/grunge-paper-background.jpg',
      }}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container} edges={['top']}>
          <ScrollView>
            <View style={styles.header}>
              <Text style={styles.logo}>
                Memoire <FontAwesome5 name="pen-fancy" size={24} color="rgb(151 88 15)" style={styles.penIcon} />
              </Text>
              <Text style={styles.headerTitle}>Profile</Text>
            </View>

            <View style={styles.profileSection}>
              <Image
                source={{ 
                  uri: profile?.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg'
                }}
                style={styles.avatar}
              />
              <Text style={styles.name}>{profile?.full_name || 'User'}</Text>
              <Text style={styles.username}>@{profile?.username || 'username'}</Text>
            </View>

            <View style={styles.menuSection}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={item.onPress}
                >
                  <View style={styles.menuItemContent}>
                    <item.icon
                      size={20}
                      color={item.danger ? Colors.error[500] : Colors.themeBrown}
                    />
                    <Text
                      style={[
                        styles.menuItemText,
                        item.danger && styles.menuItemTextDanger,
                      ]}
                    >
                      {item.title}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  logo: {
    fontFamily: 'Tangerine_400Regular',
    fontSize: 55,
    color: Colors.themeBrown,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  penIcon: {
    marginLeft: spacing.sm,
    marginTop: 5,
  },
  headerTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: typography.xxxl,
    color: Colors.themeBrown,
    marginBottom: spacing.xs,
  },
  profileSection: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.md,
    borderWidth: 3,
    borderColor: Colors.themeBrown,
  },
  name: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: typography.xl,
    color: Colors.themeBrown,
    marginBottom: spacing.xs,
  },
  username: {
    fontFamily: 'Inter_400Regular',
    fontSize: typography.md,
    color: Colors.themeBrown_colors[250],
  },
  menuSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.themeBrown_colors[250],
  },
  menuItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.themeBrown_colors[250],
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontFamily: 'Inter_500Medium',
    fontSize: typography.md,
    color: Colors.themeBrown,
    marginLeft: spacing.md,
  },
  menuItemTextDanger: {
    color: Colors.error[500],
  },
});