import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  title?: string;
  subtitle?: string;
}

export function Card({ children, style, onPress, title, subtitle }: CardProps) {
  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, style]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {title && (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        )}
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, style]}>
      {title && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.h3,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: Colors.text,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
