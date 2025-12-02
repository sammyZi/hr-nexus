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

export interface OrganizationSignupCredentials {
    organization_name: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    access_token?: string;
    token_type?: string;
    message?: string;
    email?: string;
    requires_verification?: boolean;
}

export interface VerifyEmailRequest {
    email: string;
    code: string;
}

export interface ResendVerificationRequest {
    email: string;
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

    organizationSignup: async (credentials: OrganizationSignupCredentials): Promise<AuthResponse> => {
        const response = await api.post('/organizations/signup', credentials);
        return response.data;
    },

    verifyEmail: async (data: VerifyEmailRequest): Promise<AuthResponse> => {
        const response = await api.post('/auth/verify', data);
        return response.data;
    },

    resendVerification: async (data: ResendVerificationRequest): Promise<{ message: string }> => {
        const response = await api.post('/auth/resend-verification', data);
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('organization_id');
    },

    isAuthenticated: (): boolean => {
        return !!localStorage.getItem('access_token');
    },
};

// Organization API
export interface Organization {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    settings?: Record<string, any>;
    created_at: string;
    is_active: boolean;
}

export interface OrganizationStats {
    active_users: number;
    total_documents: number;
    total_tasks: number;
    completed_tasks: number;
    pending_tasks: number;
}

export const organizationApi = {
    getCurrent: async (): Promise<Organization> => {
        const response = await api.get('/organizations/me');
        return response.data;
    },

    update: async (data: Partial<Organization>): Promise<Organization> => {
        const response = await api.put('/organizations/me', data);
        return response.data;
    },

    getStats: async (): Promise<OrganizationStats> => {
        const response = await api.get('/organizations/me/stats');
        return response.data;
    },
};

// Invitation API
export interface Invitation {
    id: string;
    organization_id: string;
    email: string;
    role: string;
    token: string;
    invited_by: string;
    expires_at: string;
    status: string;
    created_at: string;
}

export interface InvitationCreate {
    email: string;
    role: string;
}

export interface InvitationAccept {
    password: string;
}

export const invitationApi = {
    create: async (data: InvitationCreate): Promise<Invitation> => {
        const response = await api.post('/invitations', data);
        return response.data;
    },

    getAll: async (): Promise<Invitation[]> => {
        const response = await api.get('/invitations');
        return response.data;
    },

    accept: async (token: string, data: InvitationAccept): Promise<AuthResponse> => {
        const response = await api.post(`/invitations/accept/${token}`, data);
        return response.data;
    },

    revoke: async (id: string): Promise<void> => {
        await api.delete(`/invitations/${id}`);
    },

    getByToken: async (token: string): Promise<Invitation> => {
        const response = await api.get(`/invitations/token/${token}`);
        return response.data;
    },
};

// User API
export interface User {
    id: string;
    organization_id: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at: string;
}

export const userApi = {
    getAll: async (): Promise<User[]> => {
        const response = await api.get('/users');
        return response.data;
    },

    get: async (id: string): Promise<User> => {
        const response = await api.get(`/users/${id}`);
        return response.data;
    },

    updateRole: async (id: string, role: string): Promise<User> => {
        const response = await api.put(`/users/${id}/role`, { role });
        return response.data;
    },

    remove: async (id: string): Promise<void> => {
        await api.delete(`/users/${id}`);
    },
};

export default api;
