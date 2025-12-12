import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Button } from '@/components/Button';
import { Colors, Spacing, Typography, BorderRadius, FontFamily } from '@/constants/theme';

export default function ProfileScreen() {
  // Example user data (replace with real user context or props)
  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: null, // Replace with image uri if available
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        {user.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{user.name[0]}</Text>
          </View>
        )}
      </View>
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.email}>{user.email}</Text>
      <Button
        title="Edit Profile"
        style={styles.button}
        fullWidth
        onPress={() => { /* navigation or edit logic */ }}
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
  avatarContainer: {
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 48,
    color: Colors.background,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
  },
  name: {
    fontSize: Typography.h2,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
  },
  email: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
    fontFamily: FontFamily.medium,
  },
  button: {
    width: '100%',
    maxWidth: 320,
  },
});
