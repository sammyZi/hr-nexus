"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, UserPlus, Sparkles, Check } from "lucide-react";
import { authApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

export default function SignUpPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const [organizationName, setOrganizationName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const passwordRequirements = [
        { label: "At least 8 characters", met: password.length >= 8 },
        { label: "Contains a number", met: /\d/.test(password) },
        { label: "Passwords match", met: password === confirmPassword && password.length > 0 },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!organizationName.trim()) {
            showToast("error", "Organization name is required");
            return;
        }

        if (password !== confirmPassword) {
            showToast("error", "Passwords do not match");
            return;
        }

        if (password.length < 8) {
            showToast("error", "Password must be at least 8 characters");
            return;
        }

        setLoading(true);

        try {
            const response = await authApi.organizationSignup({ 
                organization_name: organizationName,
                email, 
                password 
            });
            
            // Check if verification is required
            if (response.requires_verification) {
                showToast("success", "Verification code sent to your email!");
                // Redirect to verification page
                router.push(`/verify?email=${encodeURIComponent(email)}`);
            } else if (response.access_token) {
                // Old flow (shouldn't happen with new system, but keep for safety)
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
                
                showToast("success", "Organization created successfully!");
                router.push("/dashboard");
            }
        } catch (error: any) {
            console.error('Signup error:', error);
            console.error('Error response:', error.response);
            console.error('Error response data:', error.response?.data);
            const message = error.response?.data?.detail || "Failed to create organization";
            showToast("error", message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen flex overflow-hidden">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 p-8 flex-col justify-between relative overflow-hidden">
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
                        Create Your Organization<br />& Start Managing HR
                    </h1>
                    <div className="space-y-3">
                        {[
                            "Set up your organization in minutes",
                            "Invite team members to collaborate",
                            "AI-powered document search",
                        ].map((feature, index) => (
                            <div key={index} className="flex items-center gap-3 text-white/90 text-base">
                                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                                    <Check size={12} />
                                </div>
                                <span>{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 text-purple-200 text-xs">
                    © 2024 HR Nexus. All rights reserved.
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 overflow-y-auto">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">H</span>
                        </div>
                        <span className="text-gray-900 text-xl font-bold">HR Nexus</span>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Create your organization</h2>
                            <p className="text-gray-500 mt-1.5 text-sm">Start your HR management journey</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Organization Name
                                </label>
                                <input
                                    type="text"
                                    value={organizationName}
                                    onChange={(e) => setOrganizationName(e.target.value)}
                                    placeholder="Acme Corporation"
                                    className="w-full px-3.5 py-2.5 text-base rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@company.com"
                                    className="w-full px-3.5 py-2.5 text-base rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
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
                                        className="w-full px-3.5 py-2.5 text-base rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all pr-11"
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Confirm Password
                                </label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-3.5 py-2.5 text-base rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                    required
                                />
                            </div>

                            {/* Password Requirements */}
                            {password && (
                                <div className="space-y-1.5">
                                    {passwordRequirements.map((req, index) => (
                                        <div key={index} className="flex items-center gap-2 text-sm">
                                            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                req.met ? 'bg-green-500' : 'bg-gray-200'
                                            }`}>
                                                {req.met && <Check size={10} className="text-white" />}
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
                                disabled={loading || !passwordRequirements.every(r => r.met)}
                                className="w-full py-2.5 px-4 text-base bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <UserPlus size={20} />
                                        Create Account
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="mt-4 text-center text-sm text-gray-500">
                            Already have an account?{" "}
                            <Link href="/signin" className="text-indigo-600 hover:text-indigo-700 font-medium">
                                Sign in
                            </Link>
                        </p>
                    </div>

                    <p className="mt-4 text-center text-xs text-gray-400">
                        By creating an account, you agree to our Terms & Privacy Policy
                    </p>
                </div>
            </div>
        </div>
    );
}
