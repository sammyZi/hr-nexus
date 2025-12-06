export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export const CATEGORIES = [
  'All',
  'Recruiting',
  'Onboarding',
  'Performance',
  'Learning & Development',
  'Employee Relations',
  'Offboarding',
  'Payroll',
  'Benefits',
] as const;

export const PRIORITIES = ['Low', 'Medium', 'High'] as const;

export const TASK_STATUSES = ['To Do', 'In Progress', 'Completed'] as const;

export const PILLARS = [
  {
    id: 'recruiting',
    title: 'Recruiting',
    description: 'Manage recruitment and hiring processes',
    icon: 'people',
    category: 'Recruiting',
  },
  {
    id: 'onboarding',
    title: 'Onboarding',
    description: 'Employee onboarding workflows',
    icon: 'person-add',
    category: 'Onboarding',
  },
  {
    id: 'performance',
    title: 'Performance',
    description: 'Performance reviews and management',
    icon: 'analytics',
    category: 'Performance',
  },
  {
    id: 'learning-development',
    title: 'Learning & Development',
    description: 'Training and development programs',
    icon: 'school',
    category: 'Learning & Development',
  },
  {
    id: 'employee-relations',
    title: 'Employee Relations',
    description: 'Manage employee relations and engagement',
    icon: 'people-circle',
    category: 'Employee Relations',
  },
  {
    id: 'offboarding',
    title: 'Offboarding',
    description: 'Employee exit processes',
    icon: 'exit',
    category: 'Offboarding',
  },
  {
    id: 'payroll',
    title: 'Payroll',
    description: 'Payroll management and processing',
    icon: 'cash',
    category: 'Payroll',
  },
  {
    id: 'benefits',
    title: 'Benefits',
    description: 'Employee benefits administration',
    icon: 'heart',
    category: 'Benefits',
  },
] as const;
