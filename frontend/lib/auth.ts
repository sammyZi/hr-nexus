// Auth utility functions and hooks
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            router.push('/signin');
        }
    }, [router]);
};

export const getToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('access_token');
    }
    return null;
};

export const setToken = (token: string): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', token);
    }
};

export const removeToken = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
    }
};

export const isAuthenticated = (): boolean => {
    return !!getToken();
};
