export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  category: string;
  priority: string;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
  category: string;
  priority: string;
}

export interface Document {
  id: number;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  category?: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  organization_id?: string;
}

export interface Organization {
  id: string;
  name: string;
  created_at?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  organization_name: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user?: User;
}
