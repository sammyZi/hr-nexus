import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { Colors, Spacing, Typography } from '@/constants/theme';

export default function VerifyScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="mail-outline" size={80} color={Colors.primary} />
        
        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.message}>
          We've sent you a verification link. Please check your email and click the link to verify your account.
        </Text>

        <Button
          title="Back to Sign In"
          onPress={() => router.replace('/signin')}
          fullWidth={true}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.h2,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  message: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  button: {
    width: '100%',
  },
});
