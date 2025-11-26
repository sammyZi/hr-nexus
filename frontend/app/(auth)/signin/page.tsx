"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LogIn, Sparkles } from "lucide-react";
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
            localStorage.setItem("access_token", response.access_token);
            showToast("success", "Welcome back!");
            router.push("/dashboard");
        } catch (error: any) {
            const message = error.response?.data?.detail || "Invalid credentials";
            showToast("error", message);
        } finally {
            setLoading(false);
        }
    };

    const handleDemoLogin = async () => {
        setEmail("admin@hrnexus.com");
        setPassword("admin123");
        setLoading(true);

        try {
            const response = await authApi.login({ email: "admin@hrnexus.com", password: "admin123" });
            localStorage.setItem("access_token", response.access_token);
            showToast("success", "Welcome to HR Nexus!");
            router.push("/dashboard");
        } catch (error: any) {
            showToast("error", "Demo login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 flex-col justify-between relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-xl">H</span>
                        </div>
                        <span className="text-white text-2xl font-bold">HR Nexus</span>
                    </div>
                </div>

                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3 text-white/80">
                        <Sparkles size={24} />
                        <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">AI-Powered</span>
                    </div>
                    <h1 className="text-4xl font-bold text-white leading-tight">
                        Intelligent HR Management<br />for Modern Teams
                    </h1>
                    <p className="text-blue-100 text-lg max-w-md">
                        Upload documents, ask questions in natural language, and get instant answers with precise citations.
                    </p>
                </div>

                <div className="relative z-10 text-blue-200 text-sm">
                    © 2024 HR Nexus. All rights reserved.
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-xl">H</span>
                        </div>
                        <span className="text-gray-900 text-2xl font-bold">HR Nexus</span>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
                            <p className="text-gray-500 mt-2">Sign in to your account</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@company.com"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all pr-12"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white text-gray-500">or</span>
                                </div>
                            </div>

                            <button
                                onClick={handleDemoLogin}
                                disabled={loading}
                                className="mt-4 w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Sparkles size={18} />
                                Try Demo Account
                            </button>
                        </div>

                        <p className="mt-6 text-center text-sm text-gray-500">
                            Don't have an account?{" "}
                            <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                                Sign up
                            </Link>
                        </p>
                    </div>

                    {/* Demo credentials hint */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-sm text-blue-800 font-medium">Demo Credentials</p>
                        <p className="text-sm text-blue-600 mt-1">
                            Email: admin@hrnexus.com<br />
                            Password: admin123
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
