import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { PILLARS } from '@/constants/app';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { organization } = useOrganization();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.name}>{user?.full_name || 'User'}</Text>
        {organization && (
          <Text style={styles.organization}>{organization.name}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>HR Pillars</Text>
        <View style={styles.pillarsGrid}>
          {PILLARS.map((pillar) => (
            <Card key={pillar.id} style={styles.pillarCard}>
              <View style={styles.pillarIcon}>
                <Ionicons 
                  name={pillar.icon as any} 
                  size={32} 
                  color={Colors.primary} 
                />
              </View>
              <Text style={styles.pillarTitle}>{pillar.title}</Text>
              <Text style={styles.pillarDescription} numberOfLines={2}>
                {pillar.description}
              </Text>
            </Card>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Ionicons name="checkbox-outline" size={32} color={Colors.success} />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Completed Tasks</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="time-outline" size={32} color={Colors.warning} />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    backgroundColor: Colors.background,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  greeting: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
  },
  name: {
    fontSize: Typography.h2,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  organization: {
    fontSize: Typography.caption,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  section: {
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.h3,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  pillarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  pillarCard: {
    width: '48%',
    alignItems: 'center',
  },
  pillarIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${Colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  pillarTitle: {
    fontSize: Typography.caption,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  pillarDescription: {
    fontSize: Typography.small,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.lg,
  },
  statValue: {
    fontSize: Typography.h2,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
