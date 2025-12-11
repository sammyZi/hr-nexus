import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.h2,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  input: {
    marginBottom: Spacing.lg,
  },
  button: {
    marginBottom: Spacing.md,
  },
  success: {
    color: Colors.success,
    fontSize: Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
