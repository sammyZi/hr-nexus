import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Button } from '@/components/Button';
import { Colors, Spacing, Typography, BorderRadius, FontFamily } from '@/constants/theme';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Welcome to HR Nexus</Text>
      <Text style={styles.subtitle}>
        Your all-in-one HR management platform. Get started by exploring the features below.
      </Text>
      <Button
        title="View Tasks"
        style={styles.button}
        fullWidth
        onPress={() => { /* navigation logic here */ }}
      />
      <Button
        title="Settings"
        variant="outline"
        style={styles.button}
        fullWidth
        onPress={() => { /* navigation logic here */ }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: Typography.h2,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.md,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
    fontFamily: FontFamily.medium,
  },
  button: {
    marginBottom: Spacing.md,
    width: '100%',
    maxWidth: 320,
  },
});
