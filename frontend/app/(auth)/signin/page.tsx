"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { authApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

export default function SignInPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await authApi.login({ email, password });
            console.log('[SignIn] Login response:', { hasToken: !!response.access_token });
            
            if (response.access_token) {
                localStorage.setItem("access_token", response.access_token);
                console.log('[SignIn] Token saved to localStorage');
                console.log('[SignIn] Token preview:', response.access_token.substring(0, 30) + '...');
                
                // Decode JWT to extract organization_id
                try {
                    const payload = JSON.parse(atob(response.access_token.split('.')[1]));
                    console.log('[SignIn] Token payload:', payload);
                    if (payload.organization_id) {
                        localStorage.setItem('organization_id', payload.organization_id);
                        console.log('[SignIn] Organization ID saved:', payload.organization_id);
                    }
                } catch (error) {
                    console.error('[SignIn] Failed to decode token:', error);
                }
                
                // Verify token was saved
                const savedToken = localStorage.getItem('access_token');
                console.log('[SignIn] Verification - Token in localStorage:', !!savedToken);
                
                showToast("success", "Welcome back!");
                router.push("/dashboard");
            }
        } catch (error: any) {
            const message = error.response?.data?.detail || "Invalid credentials";
            showToast("error", message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen flex overflow-hidden">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 flex-col justify-between relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-lg">H</span>
                        </div>
                        <span className="text-white text-xl font-bold">HR Nexus</span>
                    </div>
                </div>

                <div className="relative z-10 space-y-5">
                    <h1 className="text-4xl font-bold text-white leading-tight">
                        Intelligent HR Management<br />for Modern Teams
                    </h1>
                    <p className="text-blue-100 text-base max-w-md leading-relaxed">
                        Upload documents, ask questions in natural language, and get instant answers with AI-powered search.
                    </p>
                </div>

                <div className="relative z-10 text-blue-200 text-xs">
                    © 2024 HR Nexus. All rights reserved.
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 overflow-y-auto">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">H</span>
                        </div>
                        <span className="text-gray-900 text-xl font-bold">HR Nexus</span>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
                            <p className="text-gray-500 mt-1.5 text-sm">Sign in to your account</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@company.com"
                                    className="w-full px-3.5 py-2.5 text-base rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full px-3.5 py-2.5 text-base rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all pr-11"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 px-4 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <LogIn size={20} />
                                        Sign In
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="mt-4 text-center text-sm text-gray-500">
                            Don't have an account?{" "}
                            <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
