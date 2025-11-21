"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import api from "@/lib/api";

export default function SignIn() {
    const router = useRouter();
    const { showToast } = useToast();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // If already logged in, redirect to dashboard
        const token = localStorage.getItem("access_token");
        if (token) {
            router.push("/dashboard");
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post("/auth/login", {
                email,
                password,
            });

            const { access_token } = response.data;
            localStorage.setItem("access_token", access_token);

            showToast("success", "Welcome back!");
            router.push("/dashboard");
        } catch (error: any) {
            const message = error.response?.data?.detail || "Invalid email or password";
            showToast("error", message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                        HR Nexus
                    </h1>
                    <p className="text-sm text-gray-600">
                        Sign in to continue
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-10 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                                placeholder="Email"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                                placeholder="Password"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full py-3 text-base bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                    Signing in...
                                </span>
                            ) : (
                                "Sign in"
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{" "}
                            <Link href="/signup" className="text-blue-600 font-medium hover:underline">
                                Create account
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Demo credentials */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs font-semibold mb-2 text-blue-900">Demo Account</p>
                    <p className="text-xs text-blue-700">admin@hrnexus.com / admin123</p>
                </div>
            </div>
        </div>
    );
}
