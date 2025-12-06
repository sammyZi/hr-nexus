import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { Colors, Spacing, Typography } from '@/constants/theme';
import type { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
  onStatusChange?: (status: string) => void;
  onDelete?: () => void;
}

export function TaskCard({ task, onPress, onStatusChange, onDelete }: TaskCardProps) {
  const priorityColor = {
    Low: Colors.info,
    Medium: Colors.warning,
    High: Colors.error,
  }[task.priority] || Colors.textSecondary;

  const statusColor = {
    'To Do': Colors.textSecondary,
    'In Progress': Colors.warning,
    'Completed': Colors.success,
  }[task.status] || Colors.textSecondary;

  const statusBgColor = {
    'To Do': '#6B728020',
    'In Progress': '#F59E0B20',
    'Completed': '#10B98120',
  }[task.status] || '#6B728020';

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {task.title}
          </Text>
          <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
            <Text style={styles.priorityText}>{task.priority}</Text>
          </View>
        </View>
        
        <View style={styles.meta}>
          <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {task.status}
            </Text>
          </View>
          <Text style={styles.category}>{task.category}</Text>
        </View>
      </View>

      {task.description && (
        <Text style={styles.description} numberOfLines={2}>
          {task.description}
        </Text>
      )}

      <View style={styles.actions}>
        {onStatusChange && task.status !== 'Completed' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onStatusChange(task.status === 'To Do' ? 'In Progress' : 'Completed')}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color={Colors.success} />
            <Text style={styles.actionText}>
              {task.status === 'To Do' ? 'Start' : 'Complete'}
            </Text>
          </TouchableOpacity>
        )}
        
        {onDelete && (
          <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
            <Text style={[styles.actionText, { color: Colors.error }]}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  header: {
    marginBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: Typography.h4,
    fontWeight: '600',
    color: Colors.text,
    marginRight: Spacing.sm,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: Typography.small,
    fontWeight: '600',
    color: Colors.background,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: Typography.small,
    fontWeight: '600',
  },
  category: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
  },
  description: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionText: {
    fontSize: Typography.caption,
    fontWeight: '600',
    color: Colors.success,
  },
});
