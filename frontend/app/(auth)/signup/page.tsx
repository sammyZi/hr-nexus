"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import api from "@/lib/api";

export default function SignupPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

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
            await api.post("/auth/signup", { email, password });
            setSuccess(true);
            showToast("success", "Account created! Check your email to verify.");
        } catch (error: any) {
            const message = error.response?.data?.detail || "Failed to create account";
            showToast("error", message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white px-4">
                <div className="w-full max-w-md text-center">
                    <div className="bg-white rounded-lg border border-gray-200 p-10 shadow-sm">
                        <div className="mb-6 flex justify-center">
                            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-900 mb-3">Check your email</h2>
                        <p className="text-gray-600 mb-6">
                            We sent a verification link to <span className="font-medium text-gray-900">{email}</span>
                        </p>
                        <Link href="/signin" className="text-blue-600 font-medium hover:underline">
                            Back to sign in
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                        HR Nexus
                    </h1>
                    <p className="text-sm text-gray-600">
                        Create your account
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
                                minLength={6}
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
                                placeholder="Password (min 6 characters)"
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
                                    Creating account...
                                </span>
                            ) : (
                                "Create account"
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{" "}
                            <Link href="/signin" className="text-blue-600 font-medium hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
