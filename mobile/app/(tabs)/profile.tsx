import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
      <View style={styles.card}>
        <View style={styles.avatarContainer}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={48} color={Colors.background} />
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 6,
  },
  name: {
    fontSize: Typography.h2,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
    letterSpacing: 0.5,
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
