import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { FontFamily } from '@/constants/theme';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }
    setSubmitted(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Ionicons name="lock-closed-outline" size={48} color={Colors.primary} style={styles.icon} />
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you instructions to reset your password.
        </Text>
        <Input
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
        <Button
          title="Send Reset Link"
          onPress={handleSubmit}
          fullWidth
          style={styles.button}
        />
        {submitted && (
          <Text style={styles.success}>
            If this email is registered, you will receive a password reset link.
          </Text>
        )}
        <Button
          title="Back to Sign In"
          variant="outline"
          fullWidth
          style={styles.backButton}
          onPress={() => {
            // navigation.goBack() or navigation.navigate('signin')
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    alignItems: 'center',
  },
  icon: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.h2,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
    fontFamily: FontFamily.bold,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
    fontFamily: FontFamily.medium,
  },
  input: {
    marginBottom: Spacing.xl,
    width: '100%',
  },
  button: {
    marginBottom: Spacing.md,
    width: '100%',
  },
  backButton: {
    marginTop: Spacing.sm,
    width: '100%',
  },
  success: {
    color: Colors.success,
    fontSize: Typography.body,
    textAlign: 'center',
    marginTop: Spacing.lg,
    fontFamily: FontFamily.medium,
  },
});
