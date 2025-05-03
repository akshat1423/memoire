import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ImageBackground } from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/Colors';
import { spacing, typography, borderRadius } from '@/constants/Layout';
import { FontAwesome5 } from '@expo/vector-icons';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) throw error;
      
      Alert.alert(
        'Success',
        'Password reset instructions have been sent to your email.',
        [{ text: 'OK', onPress: () => router.replace('/auth/sign-in') }]
      );
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
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you instructions to reset your password.
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.themeBrown_colors[250]}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Sending...' : 'Send Reset Instructions'}
              </Text>
            </TouchableOpacity>

            <View style={styles.linksContainer}>
              <Link href="/auth/sign-in" style={styles.link}>
                Back to Sign In
              </Link>
            </View>
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
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: typography.md,
    color: Colors.themeBrown_colors[250],
    lineHeight: 24,
    textAlign: 'center',
  },
  form: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    fontFamily: 'Inter_400Regular',
    fontSize: typography.md,
    color: Colors.themeBrown,
    borderWidth: 1,
    borderColor: Colors.themeBrown_colors[250],
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
  linksContainer: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  link: {
    color: Colors.themeBrown,
    fontFamily: 'Inter_500Medium',
    fontSize: typography.sm,
    textAlign: 'center',
  },
});