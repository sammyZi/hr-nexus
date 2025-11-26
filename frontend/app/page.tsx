"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
    Sparkles, 
    FileText, 
    MessageSquare, 
    Shield, 
    Zap, 
    ArrowRight,
    Check,
    Users,
    BarChart3
} from "lucide-react";

// ============================================================================
// COMPONENTS
// ============================================================================

const FeatureCard = ({ icon: Icon, title, description }: { 
    icon: React.ElementType; 
    title: string; 
    description: string;
}) => (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-300 group">
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all">
            <Icon size={24} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LandingPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to dashboard if already logged in
        const token = localStorage.getItem("access_token");
        if (token) {
            router.push("/dashboard");
        }
    }, [router]);

    const features = [
        {
            icon: Sparkles,
            title: "AI-Powered Search",
            description: "Ask questions in natural language and get instant, accurate answers from your documents."
        },
        {
            icon: FileText,
            title: "Document Management",
            description: "Upload, organize, and search through PDFs, Word docs, and text files effortlessly."
        },
        {
            icon: MessageSquare,
            title: "Smart Citations",
            description: "Every answer includes precise citations so you can verify the source information."
        },
        {
            icon: Shield,
            title: "Secure & Private",
            description: "Your documents are processed locally. No data leaves your infrastructure."
        },
        {
            icon: Zap,
            title: "Lightning Fast",
            description: "Optimized for speed with real-time streaming responses and instant search."
        },
        {
            icon: BarChart3,
            title: "HR Analytics",
            description: "Track tasks, manage workflows, and get insights across all HR operations."
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                                <span className="text-white font-bold text-lg">H</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">HR Nexus</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link 
                                href="/signin"
                                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link 
                                href="/signup"
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-600/20"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-6">
                            <Sparkles size={16} />
                            AI-Powered HR Management
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
                            Your HR Documents,{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                Instantly Searchable
                            </span>
                        </h1>
                        <p className="text-xl text-gray-500 mb-8 leading-relaxed">
                            Upload HR policies, handbooks, and documents. Ask questions in plain English 
                            and get accurate answers with citations. No more digging through files.
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <Link 
                                href="/signup"
                                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl shadow-blue-600/20 flex items-center gap-2"
                            >
                                Start Free
                                <ArrowRight size={20} />
                            </Link>
                            <Link 
                                href="/signin"
                                className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                            >
                                Sign In
                            </Link>
                        </div>
                    </div>

                    {/* Demo Preview */}
                    <div className="mt-16 relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none" />
                        <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                            <div className="bg-gray-100 px-4 py-3 flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400" />
                                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                <div className="w-3 h-3 rounded-full bg-green-400" />
                            </div>
                            <div className="p-8 bg-gradient-to-br from-gray-50 to-white min-h-[300px] flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <MessageSquare size={32} className="text-blue-600" />
                                    </div>
                                    <p className="text-gray-400 text-lg">AI Assistant Preview</p>
                                    <p className="text-gray-300 text-sm mt-2">Sign in to start asking questions</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-6 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Everything you need for modern HR
                        </h2>
                        <p className="text-gray-500 max-w-2xl mx-auto">
                            Powerful features designed to streamline your HR operations and make information accessible.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <FeatureCard key={index} {...feature} />
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-3xl p-12 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                        
                        <div className="relative z-10">
                            <h2 className="text-3xl font-bold text-white mb-4">
                                Ready to transform your HR?
                            </h2>
                            <p className="text-blue-100 mb-8 max-w-xl mx-auto">
                                Join thousands of HR professionals using AI to work smarter, not harder.
                            </p>
                            <Link 
                                href="/signup"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all shadow-xl"
                            >
                                Get Started Free
                                <ArrowRight size={20} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-6 border-t border-gray-100">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">H</span>
                        </div>
                        <span className="text-gray-600 text-sm">© 2024 HR Nexus</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                        <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
                        <a href="#" className="hover:text-gray-900 transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
