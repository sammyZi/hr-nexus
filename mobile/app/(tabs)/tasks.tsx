import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskCard } from '@/components/TaskCard';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card } from '@/components/Card';
import { api } from '@/lib/api';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { CATEGORIES, PRIORITIES } from '@/constants/app';
import type { Task, TaskCreate } from '@/types';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Recruiting');
  const [priority, setPriority] = useState('Medium');

  useEffect(() => {
    loadTasks();
  }, [selectedCategory]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await api.getTasks(selectedCategory !== 'All' ? selectedCategory : undefined);
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCreateTask = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    try {
      const taskData: TaskCreate = {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        priority,
      };

      if (editingTask) {
        await api.updateTask(editingTask.id, taskData);
      } else {
        await api.createTask(taskData);
      }

      setModalVisible(false);
      resetForm();
      loadTasks();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save task');
    }
  };

  const handleStatusChange = async (task: Task, newStatus: string) => {
    try {
      await api.updateTaskStatus(task.id, newStatus);
      loadTasks();
    } catch (error) {
      Alert.alert('Error', 'Failed to update task status');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteTask(taskId);
            loadTasks();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete task');
          }
        },
      },
    ]);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setCategory(task.category);
    setPriority(task.priority);
    setModalVisible(true);
  };

  const resetForm = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setCategory('Recruiting');
    setPriority('Medium');
  };

  const filteredTasks = tasks.filter(task =>
    selectedCategory === 'All' || task.category === selectedCategory
  );

  return (
    <View style={styles.container}>
      {/* Category Filter */}
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryChip,
              ...(selectedCategory === cat ? [styles.categoryChipActive] : []),
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text
              style={[
                styles.categoryChipText,
                ...(selectedCategory === cat ? [styles.categoryChipTextActive] : []),
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tasks List */}
      <ScrollView
        style={styles.tasksList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            loadTasks();
          }} />
        }
      >
        {filteredTasks.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="clipboard-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No tasks found</Text>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onPress={() => openEditModal(task)}
              onStatusChange={(status) => handleStatusChange(task, status)}
              onDelete={() => handleDeleteTask(task.id)}
            />
          ))
        )}
      </ScrollView>

      {/* Create Task Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          resetForm();
          setModalVisible(true);
        }}
      >
        <Ionicons name="add" size={28} color={Colors.background} />
      </TouchableOpacity>

      {/* Create/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingTask ? 'Edit Task' : 'Create Task'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Input
              label="Title"
              value={title}
              onChangeText={setTitle}
              placeholder="Enter task title"
            />

            <Input
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Enter task description (optional)"
              multiline={true}
              numberOfLines={4}
              style={styles.textArea}
            />

            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.optionScroll}>
              {CATEGORIES.filter(c => c !== 'All').map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.optionChip, ...(category === cat ? [styles.optionChipActive] : [])]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.optionChipText, ...(category === cat ? [styles.optionChipTextActive] : [])]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Priority</Text>
            <View style={styles.priorityRow}>
              {PRIORITIES.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.optionChip, ...(priority === p ? [styles.optionChipActive] : [])]}
                  onPress={() => setPriority(p)}
                >
                  <Text style={[styles.optionChipText, ...(priority === p ? [styles.optionChipTextActive] : [])]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title={editingTask ? 'Update Task' : 'Create Task'}
              onPress={handleCreateTask}
              fullWidth={true}
              style={styles.submitButton}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  categoryScroll: {
    maxHeight: 50,
    backgroundColor: Colors.background,
  },
  categoryContent: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    marginRight: Spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: Typography.caption,
    fontWeight: '600',
    color: Colors.text,
  },
  categoryChipTextActive: {
    color: Colors.background,
  },
  tasksList: {
    flex: 1,
    padding: Spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  emptyText: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: Typography.h3,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: Typography.caption,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  optionScroll: {
    marginBottom: Spacing.md,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  optionChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  optionChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionChipText: {
    fontSize: Typography.caption,
    fontWeight: '600',
    color: Colors.text,
  },
  optionChipTextActive: {
    color: Colors.background,
  },
  submitButton: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
});
