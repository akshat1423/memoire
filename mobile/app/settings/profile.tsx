import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image, ImageBackground } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/Colors';
import { spacing, typography, borderRadius } from '@/constants/Layout';
import { FontAwesome5 } from '@expo/vector-icons';

export default function EditProfile() {
  const [profile, setProfile] = useState({
    username: '',
    full_name: '',
    avatar_url: '',
  });
  const [loading, setLoading] = useState(false);

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
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('profiles')
        .update({
          username: profile.username,
          full_name: profile.full_name,
          updated_at: new Date(),
        })
        .eq('id', user.id);

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={{
        uri: 'https://ynxmsntmoccpldagoxrh.supabase.co/storage/v1/object/public/memoireapp/default-user/grunge-paper-background.jpg',
      }}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.logo}>
              Memoire <FontAwesome5 name="pen-fancy" size={24} color="rgb(151 88 15)" style={styles.penIcon} />
            </Text>
            <Text style={styles.title}>Edit Profile</Text>
          </View>

          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: profile.avatar_url || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg',
              }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.changeAvatarButton}>
              <Text style={styles.changeAvatarText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={profile.username}
                onChangeText={(text) => setProfile({ ...profile, username: text })}
                placeholder="Enter username"
                placeholderTextColor={Colors.themeBrown_colors[250]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={profile.full_name}
                onChangeText={(text) => setProfile({ ...profile, full_name: text })}
                placeholder="Enter full name"
                placeholderTextColor={Colors.themeBrown_colors[250]}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleUpdateProfile}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
    padding: spacing.xl,
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing.xxl,
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
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: typography.xxxl,
    color: Colors.themeBrown,
    marginBottom: spacing.xs,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: spacing.md,
    borderWidth: 3,
    borderColor: Colors.themeBrown,
  },
  changeAvatarButton: {
    padding: spacing.sm,
  },
  changeAvatarText: {
    color: Colors.themeBrown,
    fontFamily: 'Inter_500Medium',
    fontSize: typography.sm,
  },
  form: {
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: typography.sm,
    color: Colors.themeBrown,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.themeBrown_colors[250],
    fontFamily: 'Inter_400Regular',
    fontSize: typography.md,
    color: Colors.themeBrown,
  },
  button: {
    backgroundColor: Colors.themeBrown,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: Colors.white,
    fontFamily: 'Inter_600SemiBold',
    fontSize: typography.md,
  },
});