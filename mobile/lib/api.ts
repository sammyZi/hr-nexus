import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_URL } from '@/constants/app';
import { storage } from './storage';
import type { Task, TaskCreate, Document, AuthResponse, SignInData, SignUpData } from '@/types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Request interceptor
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await storage.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          await storage.removeToken();
          // Navigation will be handled by the context
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth APIs
  async signIn(data: SignInData): Promise<AuthResponse> {
    const formData = new URLSearchParams();
    formData.append('username', data.email);
    formData.append('password', data.password);

    const response = await this.client.post('/auth/signin', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  }

  async signUp(data: SignUpData): Promise<AuthResponse> {
    const response = await this.client.post('/auth/signup', data);
    return response.data;
  }

  async verifyEmail(token: string): Promise<void> {
    await this.client.get(`/auth/verify/${token}`);
  }

  async acceptInvitation(token: string, password: string, fullName: string): Promise<AuthResponse> {
    const response = await this.client.post(`/invitations/accept/${token}`, {
      password,
      full_name: fullName,
    });
    return response.data;
  }

  // Task APIs
  async getTasks(category?: string): Promise<Task[]> {
    const url = category && category !== 'All' ? `/tasks?category=${category}` : '/tasks';
    const response = await this.client.get(url);
    return response.data;
  }

  async createTask(task: TaskCreate): Promise<Task> {
    const response = await this.client.post('/tasks', task);
    return response.data;
  }

  async updateTask(id: string, task: TaskCreate): Promise<Task> {
    const response = await this.client.put(`/tasks/${id}`, task);
    return response.data;
  }

  async updateTaskStatus(id: string, status: string): Promise<void> {
    await this.client.patch(`/tasks/${id}/status`, null, {
      params: { status },
    });
  }

  async deleteTask(id: string): Promise<void> {
    await this.client.delete(`/tasks/${id}`);
  }

  // Document APIs
  async getDocuments(category?: string): Promise<Document[]> {
    const url = category ? `/documents?category=${category}` : '/documents';
    const response = await this.client.get(url);
    return response.data;
  }

  async uploadDocument(uri: string, fileName: string, category?: string): Promise<Document> {
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: fileName,
      type: 'application/octet-stream',
    } as any);

    if (category) {
      formData.append('category', category);
    }

    const response = await this.client.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteDocument(id: number): Promise<void> {
    await this.client.delete(`/documents/${id}`);
  }

  // Chat API
  async sendMessage(
    query: string,
    history?: Array<{ role: string; content: string }>,
    fileUri?: string,
    fileName?: string
  ): Promise<{ answer: string; query: string }> {
    const formData = new FormData();
    formData.append('query', query);

    if (fileUri && fileName) {
      formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: 'application/octet-stream',
      } as any);
    }

    if (history && history.length > 0) {
      formData.append('history', JSON.stringify(history));
    }

    const response = await this.client.post('/chat', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Organization APIs
  async getCurrentUser(): Promise<any> {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  async getOrganization(): Promise<any> {
    const response = await this.client.get('/organization');
    return response.data;
  }
}

export const api = new ApiClient();
