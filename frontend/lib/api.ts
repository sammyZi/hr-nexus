import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear token and redirect to signin
            localStorage.removeItem('access_token');
            if (typeof window !== 'undefined') {
                window.location.href = '/signin';
            }
        }
        return Promise.reject(error);
    }
);

// Types
export interface Task {
    id: number;
    title: string;
    description?: string;
    status: string;
    category: string;
    priority: string;
    owner_id: number;
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

// Task API
export const taskApi = {
    getAll: async (category?: string): Promise<Task[]> => {
        const url = category && category !== 'All'
            ? `/tasks?category=${category}`
            : '/tasks';
        const response = await api.get(url);
        return response.data;
    },

    create: async (task: TaskCreate): Promise<Task> => {
        const response = await api.post('/tasks', task);
        return response.data;
    },

    update: async (id: number, task: TaskCreate): Promise<Task> => {
        const response = await api.put(`/tasks/${id}`, task);
        return response.data;
    },

    updateStatus: async (id: number, status: string): Promise<void> => {
        await api.patch(`/tasks/${id}/status`, null, {
            params: { status }
        });
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/tasks/${id}`);
    },
};

// Document API
export const documentApi = {
    getAll: async (category?: string): Promise<Document[]> => {
        const url = category ? `/documents?category=${category}` : '/documents';
        const response = await api.get(url);
        return response.data;
    },

    upload: async (file: File, category?: string): Promise<Document> => {
        const formData = new FormData();
        formData.append('file', file);
        if (category) {
            formData.append('category', category);
        }

        const response = await api.post('/documents/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/documents/${id}`);
    },
};

// Chat API
export const chatApi = {
    sendMessage: async (
        query: string, 
        file?: File, 
        history?: Array<{role: string; content: string}>
    ): Promise<{ answer: string; query: string }> => {
        const formData = new FormData();
        formData.append('query', query);
        if (file) {
            formData.append('file', file);
        }
        if (history && history.length > 0) {
            formData.append('history', JSON.stringify(history));
        }

        const response = await api.post('/chat', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};

// Auth API
export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignupCredentials {
    email: string;
    password: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
}

export const authApi = {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },

    signup: async (credentials: SignupCredentials): Promise<AuthResponse> => {
        const response = await api.post('/auth/signup', credentials);
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('access_token');
    },

    isAuthenticated: (): boolean => {
        return !!localStorage.getItem('access_token');
    },
};

export default api;
