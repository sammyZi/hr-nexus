"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, ArrowLeft, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { authApi } from "@/lib/api";

export default function VerifyPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();
    
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    useEffect(() => {
        // Get email from query params
        const emailParam = searchParams.get("email");
        if (emailParam) {
            setEmail(emailParam);
        }
    }, [searchParams]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !code) {
            showToast("error", "Please enter email and verification code");
            return;
        }

        if (code.length !== 6) {
            showToast("error", "Verification code must be 6 digits");
            return;
        }

        setLoading(true);

        try {
            const response = await authApi.verifyEmail({ email, code });

            // Store token if provided
            if (response.access_token) {
                localStorage.setItem("access_token", response.access_token);
                
                // Decode JWT to extract organization_id
                try {
                    const payload = JSON.parse(atob(response.access_token.split('.')[1]));
                    if (payload.organization_id) {
                        localStorage.setItem('organization_id', payload.organization_id);
                    }
                } catch (error) {
                    console.error('Failed to decode token:', error);
                }
            }

            showToast("success", "Email verified successfully!");
            router.push("/dashboard");
        } catch (error: any) {
            console.error('Verification error:', error);
            const message = error.response?.data?.detail || "Verification failed";
            showToast("error", message);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email) {
            showToast("error", "Please enter your email");
            return;
        }

        setResending(true);

        try {
            await authApi.resendVerification({ email });
            showToast("success", "New verification code sent to your email!");
        } catch (error: any) {
            console.error('Resend error:', error);
            const message = error.response?.data?.detail || "Failed to resend code";
            showToast("error", message);
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 p-12 flex-col justify-between relative overflow-hidden">
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
                    <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-6">
                        <Mail size={32} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-white leading-tight">
                        Check Your Email
                    </h1>
                    <p className="text-white/90 text-lg">
                        We've sent a 6-digit verification code to your email address. 
                        Enter it below to complete your registration.
                    </p>
                </div>

                <div className="relative z-10 text-purple-200 text-sm">
                    © 2024 HR Nexus. All rights reserved.
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-xl">H</span>
                        </div>
                        <span className="text-gray-900 text-2xl font-bold">HR Nexus</span>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Mail size={32} className="text-indigo-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Verify Your Email</h2>
                            <p className="text-gray-500 mt-2">Enter the 6-digit code sent to your email</p>
                        </div>

                        <form onSubmit={handleVerify} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@company.com"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Verification Code
                                </label>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="123456"
                                    maxLength={6}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-center text-2xl font-mono tracking-widest"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    Enter the 6-digit code from your email
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || code.length !== 6}
                                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    "Verify Email"
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <button
                                onClick={handleResend}
                                disabled={resending}
                                className="text-indigo-600 hover:text-indigo-700 font-medium text-sm inline-flex items-center gap-2 disabled:opacity-50"
                            >
                                {resending ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw size={16} />
                                        Resend Code
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <Link 
                                href="/signin" 
                                className="text-gray-600 hover:text-gray-900 font-medium text-sm inline-flex items-center gap-2"
                            >
                                <ArrowLeft size={16} />
                                Back to Sign In
                            </Link>
                        </div>
                    </div>

                    <p className="mt-6 text-center text-xs text-gray-400">
                        Didn't receive the code? Check your spam folder or click resend
                    </p>
                </div>
            </div>
        </div>
    );
}
