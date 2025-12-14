import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, FontFamily } from '@/constants/theme';

interface StatCard {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

const statCards: StatCard[] = [
  {
    title: 'Total Documents',
    value: 12, // TODO: fetch real data
    icon: <Feather name="file-text" size={24} color="#2563eb" />,
    color: '#2563eb',
    change: '12 uploaded',
    changeType: 'neutral',
  },
  {
    title: 'AI Assistant',
    value: 'Ready',
    icon: <MaterialCommunityIcons name="robot-excited-outline" size={24} color="#7c3aed" />,
    color: '#7c3aed',
    change: 'Ask me anything',
    changeType: 'positive',
  },
  {
    title: 'HR Pillars',
    value: 8,
    icon: <Ionicons name="cart-outline" size={24} color="#f59e42" />,
    color: '#f59e42',
    change: 'All active',
    changeType: 'positive',
  },
  {
    title: 'Quick Access',
    value: 'Active',
    icon: <Feather name="zap" size={24} color="#22c55e" />,
    color: '#22c55e',
    change: 'All systems ready',
    changeType: 'positive',
  },
];

export default function DashboardScreen() {
  const [greeting, setGreeting] = useState('Good morning');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 17) setGreeting('Good afternoon');
    else if (hour >= 17) setGreeting('Good evening');
    // TODO: fetch dashboard stats here
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>{greeting}! 👋</Text>
      <Text style={styles.subtitle}>Here's what's happening with your HR operations</Text>
      <View style={styles.statsGrid}>
        {statCards.map((stat, idx) => (
          <Card key={idx} style={styles.statCard}>
            <View style={styles.statIcon}>{stat.icon}</View>
            <Text style={styles.statTitle}>{stat.title}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
            {stat.change && (
              <Text style={[styles.statChange, stat.changeType === 'positive' ? styles.positive : stat.changeType === 'negative' ? styles.negative : styles.neutral]}>
                {stat.change}
              </Text>
            )}
          </Card>
        ))}
      </View>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <Card style={styles.quickActionCard}>
          <Text style={styles.quickActionTitle}>AI Assistant</Text>
          <Text style={styles.quickActionDesc}>Ask questions about your HR documents</Text>
          <Button title="Get Started" style={styles.quickActionButton} onPress={() => {}} />
        </Card>
        <Card style={styles.quickActionCard}>
          <Text style={styles.quickActionTitle}>Upload Documents</Text>
          <Text style={styles.quickActionDesc}>Add new HR documents to your library</Text>
          <Button title="Upload Now" style={styles.quickActionButton} onPress={() => {}} />
        </Card>
      </View>
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <Card style={styles.activityCard}>
        <View style={styles.activityItem}>
          <Ionicons name="checkmark-circle-outline" size={20} color={Colors.primary} style={styles.activityIcon} />
          <View style={styles.activityTextWrap}>
            <Text style={styles.activityTitle}>System Ready</Text>
            <Text style={styles.activityDesc}>Your HR Nexus dashboard is set up and ready to use</Text>
            <Text style={styles.activityTime}>Just now</Text>
          </View>
        </View>
        <View style={styles.activityItem}>
          <Feather name="zap" size={20} color={Colors.success} style={styles.activityIcon} />
          <View style={styles.activityTextWrap}>
            <Text style={styles.activityTitle}>AI Assistant Available</Text>
            <Text style={styles.activityDesc}>Start asking questions about your HR documents</Text>
            <Text style={styles.activityTime}>Today</Text>
          </View>
        </View>
        <View style={styles.activityItem}>
          <Ionicons name="cart-outline" size={20} color={Colors.secondary} style={styles.activityIcon} />
          <View style={styles.activityTextWrap}>
            <Text style={styles.activityTitle}>Welcome to HR Nexus</Text>
            <Text style={styles.activityDesc}>Get started by uploading your first document</Text>
            <Text style={styles.activityTime}>Today</Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    padding: Spacing.lg,
  },
  greeting: {
    fontSize: Typography.h2,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.sm,
    fontFamily: FontFamily.bold,
  },
  subtitle: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    fontFamily: FontFamily.medium,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: '48%',
    marginBottom: Spacing.md,
    alignItems: 'center',
    padding: Spacing.md,
  },
  statIcon: {
    marginBottom: Spacing.sm,
  },
  statTitle: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    fontFamily: FontFamily.medium,
  },
  statValue: {
    fontSize: Typography.h3,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: FontFamily.bold,
  },
  statChange: {
    fontSize: Typography.caption,
    marginTop: 2,
    fontFamily: FontFamily.medium,
  },
  positive: {
    color: Colors.success,
  },
  negative: {
    color: Colors.error,
  },
  neutral: {
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: Typography.h4,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    fontFamily: FontFamily.bold,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  quickActionCard: {
    width: '48%',
    alignItems: 'center',
    padding: Spacing.md,
  },
  quickActionTitle: {
    fontSize: Typography.body,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.xs,
    fontFamily: FontFamily.bold,
  },
  quickActionDesc: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    fontFamily: FontFamily.medium,
  },
  quickActionButton: {
    width: '100%',
  },
  activityCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  activityIcon: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  activityTextWrap: {
    flex: 1,
  },
  activityTitle: {
    fontSize: Typography.body,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: FontFamily.bold,
  },
  activityDesc: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    fontFamily: FontFamily.medium,
  },
  activityTime: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    fontFamily: FontFamily.medium,
    marginTop: 2,
  },
});
