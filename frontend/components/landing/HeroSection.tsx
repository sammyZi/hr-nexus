"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, MessageSquare, Sparkles, Users, Calendar, FileText, BarChart3, Shield } from "lucide-react";
import { motion } from "framer-motion";
import GridBackground from "./GridBackground";

const HeroSection = () => {

    return (
        <section className="relative min-h-screen pt-24 pb-16 px-6 overflow-hidden">
            {/* Grid Background Component */}
            <GridBackground />
            
            {/* Content */}
            <div className="max-w-6xl mx-auto relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
                    {/* Left - Text */}
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="space-y-5"
                    >
                        {/* Badge */}
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full"
                        >
                            <Sparkles size={16} className="text-blue-600" />
                            <motion.span 
                                className="text-sm font-semibold bg-clip-text text-transparent"
                                style={{
                                    backgroundImage: "linear-gradient(90deg, #2563eb, #7c3aed, #db2777, #7c3aed, #2563eb)",
                                    backgroundSize: "200% 100%",
                                }}
                                animate={{ backgroundPosition: ["0% 0%", "200% 0%"] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            >
                                AI-Powered HR Assistant
                            </motion.span>
                        </motion.div>
                        
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight"
                        >
                            All-in-One{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                                HR Platform
                            </span>
                        </motion.h1>
                        
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-lg text-gray-600"
                        >
                            Manage your entire HR operations with AI-powered insights. Simple, fast, and smart.
                        </motion.p>

                        {/* HR Features */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.25 }}
                            className="grid grid-cols-2 gap-2 pt-2"
                        >
                            <div className="flex items-center gap-2 text-gray-700">
                                <Users size={16} className="text-blue-600" />
                                <span className="text-sm">Employees</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                                <Calendar size={16} className="text-green-600" />
                                <span className="text-sm">Leave & Time</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                                <BarChart3 size={16} className="text-purple-600" />
                                <span className="text-sm">Payroll</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                                <FileText size={16} className="text-orange-600" />
                                <span className="text-sm">Documents</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                                <MessageSquare size={16} className="text-indigo-600" />
                                <span className="text-sm">AI Assistant</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                                <Shield size={16} className="text-red-600" />
                                <span className="text-sm">Compliance</span>
                            </div>
                        </motion.div>

                        {/* HR Metrics */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.35 }}
                            className="grid grid-cols-3 gap-3 pt-4"
                        >
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-2xl font-bold text-blue-600">95%</p>
                                <p className="text-xs text-gray-600 mt-1">Time Saved</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-2xl font-bold text-green-600">24/7</p>
                                <p className="text-xs text-gray-600 mt-1">Support</p>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                                <p className="text-2xl font-bold text-purple-600">500+</p>
                                <p className="text-xs text-gray-600 mt-1">Companies</p>
                            </div>
                        </motion.div>
                        
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="flex items-center gap-3 pt-4"
                        >
                            <Link 
                                href="/signup"
                                className="group px-6 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-all flex items-center gap-2 shadow-lg"
                            >
                                Get Started Free
                                <ArrowRight size={16} />
                            </Link>
                            <Link 
                                href="/signin"
                                className="px-6 py-3 text-gray-900 font-medium rounded-xl border-2 border-gray-900 hover:bg-gray-900 hover:text-white transition-all"
                            >
                                Sign In
                            </Link>
                        </motion.div>
                        
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.45 }}
                            className="flex items-center gap-5 pt-2 text-sm text-gray-500"
                        >
                            <span className="flex items-center gap-1.5">
                                <CheckCircle2 size={14} className="text-green-500" />
                                Free to start
                            </span>
                            <span className="flex items-center gap-1.5">
                                <CheckCircle2 size={14} className="text-green-500" />
                                No credit card
                            </span>
                        </motion.div>
                    </motion.div>
                    
                    {/* Right - App Screenshot Placeholder */}
                    <motion.div
                        initial={{ opacity: 0, x: 30, y: 20 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="relative"
                    >
                        <div className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex items-center gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-400" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                    <div className="w-3 h-3 rounded-full bg-green-400" />
                                </div>
                                <span className="flex-1 text-center text-xs text-gray-500 font-medium">HR Nexus Dashboard</span>
                            </div>

                            {/* App Screenshot Placeholder */}
                            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center min-h-[500px] w-full relative overflow-hidden">
                                <div className="text-center space-y-3 z-10">
                                    <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mx-auto flex items-center justify-center">
                                        <Sparkles size={40} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">App Screenshot</p>
                                        <p className="text-xs text-gray-200 mt-1">Add your PNG image here</p>
                                    </div>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                            </div>
                        </div>
                        
                        {/* Floating Badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 1 }}
                            className="absolute -right-4 top-20 bg-white rounded-xl p-4 shadow-lg border border-gray-200 w-48"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                                    <CheckCircle2 size={18} className="text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">All Set!</p>
                                    <p className="text-xs text-gray-600">Your HR data is ready</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
