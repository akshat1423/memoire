import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ImageBackground } from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/Colors';
import { spacing, typography, borderRadius } from '@/constants/Layout';
import { FontAwesome5 } from '@expo/vector-icons';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName,
          },
        },
      });

      if (error) throw error;
      
      Alert.alert(
        'Success',
        'Account created successfully! Please sign in.',
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start your journaling journey</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={Colors.themeBrown_colors[250]}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={Colors.themeBrown_colors[250]}
              value={fullName}
              onChangeText={setFullName}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.themeBrown_colors[250]}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={Colors.themeBrown_colors[250]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Creating account...' : 'Sign Up'}
              </Text>
            </TouchableOpacity>

            <View style={styles.linksContainer}>
              <Link href="/auth/sign-in" style={styles.link}>
                Already have an account? Sign in
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