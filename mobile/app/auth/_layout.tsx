import { Stack } from 'expo-router';
import { View } from 'react-native';
import Colors from '@/constants/Colors';

export default function AuthLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.brown[50] }}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </View>
  );
}