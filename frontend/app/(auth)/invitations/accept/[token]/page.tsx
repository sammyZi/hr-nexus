"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Check, Mail, Building2, Loader2 } from "lucide-react";
import { invitationApi, Invitation } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { showToast } from "@/components/ui/Toast";

export default function AcceptInvitationPage() {
    const router = useRouter();
    const params = useParams();
    const token = params.token as string;
    
    const [invitation, setInvitation] = useState<Invitation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadInvitation();
    }, [token]);

    const loadInvitation = async () => {
        try {
            setLoading(true);
            const data = await invitationApi.getByToken(token);
            
            if (data.status !== 'pending') {
                setError('This invitation is no longer valid');
                return;
            }
            
            const expiresAt = new Date(data.expires_at);
            if (expiresAt < new Date()) {
                setError('This invitation has expired');
                return;
            }
            
            setInvitation(data);
        } catch (err: any) {
            console.error('Failed to load invitation:', err);
            setError(err.response?.data?.detail || 'Invalid invitation link');
        } finally {
            setLoading(false);
        }
    };

    const passwordRequirements = [
        { label: "At least 8 characters", met: password.length >= 8 },
        { label: "Contains a number", met: /\d/.test(password) },
        { label: "Passwords match", met: password === confirmPassword && password.length > 0 },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            showToast("Passwords do not match", "error");
            return;
        }

        if (password.length < 8) {
            showToast("Password must be at least 8 characters", "error");
            return;
        }

        setSubmitting(true);

        try {
            const response = await invitationApi.accept(token, { password });
            
            // Store token and extract organization_id
            if (response.access_token) {
                setToken(response.access_token);
                showToast("Welcome! Your account has been created.", "success");
                router.push("/dashboard");
            } else {
                showToast("Failed to receive authentication token", "error");
            }
        } catch (error: any) {
            const message = error.response?.data?.detail || "Failed to accept invitation";
            showToast(message, "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading invitation...</p>
                </div>
            </div>
        );
    }

    if (error || !invitation) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 sm:p-8">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 sm:p-8 text-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <Mail className="text-red-600" size={28} />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
                    <p className="text-sm sm:text-base text-gray-600 mb-5 sm:mb-6">{error}</p>
                    <Link
                        href="/signin"
                        className="inline-block px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
                    >
                        Go to Sign In
                    </Link>
                </div>
            </div>
        );
    }

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
                    <h1 className="text-4xl font-bold text-white leading-tight">
                        Join Your Team<br />on HR Nexus
                    </h1>
                    <div className="space-y-4">
                        {[
                            "Access your organization's HR documents",
                            "Collaborate with your team",
                            "Get AI-powered assistance",
                        ].map((feature, index) => (
                            <div key={index} className="flex items-center gap-3 text-white/90">
                                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                    <Check size={14} />
                                </div>
                                <span>{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 text-purple-200 text-sm">
                    © 2024 HR Nexus. All rights reserved.
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-gray-50">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg sm:text-xl">H</span>
                        </div>
                        <span className="text-gray-900 text-xl sm:text-2xl font-bold">HR Nexus</span>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-5 sm:p-8">
                        <div className="text-center mb-6 sm:mb-8">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                                <Mail className="text-indigo-600" size={28} />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Accept Invitation</h2>
                            <p className="text-sm sm:text-base text-gray-500 mt-2">Create your account to get started</p>
                        </div>

                        {/* Invitation Details */}
                        <div className="bg-indigo-50 rounded-xl p-3 sm:p-4 mb-5 sm:mb-6 space-y-2">
                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                                <Mail size={14} className="text-indigo-600 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="text-gray-700 truncate">
                                    <span className="font-medium">Email:</span> {invitation.email}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                                <Building2 size={14} className="text-indigo-600 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="text-gray-700">
                                    <span className="font-medium">Role:</span> {invitation.role}
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                                    Create Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all pr-11 sm:pr-12"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={18} className="sm:w-5 sm:h-5" /> : <Eye size={18} className="sm:w-5 sm:h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                                    Confirm Password
                                </label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                    required
                                />
                            </div>

                            {/* Password Requirements */}
                            {password && (
                                <div className="space-y-1.5 sm:space-y-2">
                                    {passwordRequirements.map((req, index) => (
                                        <div key={index} className="flex items-center gap-2 text-xs sm:text-sm">
                                            <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                req.met ? 'bg-green-500' : 'bg-gray-200'
                                            }`}>
                                                {req.met && <Check size={8} className="text-white sm:w-2.5 sm:h-2.5" />}
                                            </div>
                                            <span className={req.met ? 'text-green-600' : 'text-gray-500'}>
                                                {req.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting || !passwordRequirements.every(r => r.met)}
                                className="w-full py-2.5 sm:py-3 px-4 text-sm sm:text-base bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        <span className="hidden sm:inline">Creating Account...</span>
                                        <span className="sm:hidden">Creating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check size={18} />
                                        <span className="hidden sm:inline">Accept & Create Account</span>
                                        <span className="sm:hidden">Accept Invitation</span>
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="mt-5 sm:mt-6 text-center text-xs sm:text-sm text-gray-500">
                            Already have an account?{" "}
                            <Link href="/signin" className="text-indigo-600 hover:text-indigo-700 font-medium">
                                Sign in
                            </Link>
                        </p>
                    </div>

                    <p className="mt-4 sm:mt-6 text-center text-xs text-gray-400 px-2">
                        By creating an account, you agree to our Terms of Service and Privacy Policy
                    </p>
                </div>
            </div>
        </div>
    );
}
