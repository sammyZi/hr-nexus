"use client";

import { Check } from "lucide-react";
import { motion } from "framer-motion";

const benefits = [
    "Save hours searching through documents",
    "Get accurate answers with source citations",
    "Support for PDF, Word, and text files",
    "Natural language queries - no training needed",
    "Organize tasks by HR categories",
    "Multi-tenant organization support",
    "Invite team members to collaborate",
    "Secure document storage"
];

const BenefitsSection = () => {
    return (
        <section id="benefits" className="py-20 px-6 bg-white">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                        <p className="text-sm font-semibold text-blue-600 mb-2 uppercase tracking-wide">Benefits</p>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Why choose HR Nexus?
                        </h2>
                        <p className="text-gray-600 mb-8">
                            Built for modern HR teams who want to work smarter, not harder.
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {benefits.map((benefit, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true, margin: "-50px" }}
                                    transition={{ 
                                        duration: 0.4,
                                        delay: i * 0.05,
                                        ease: "easeOut"
                                    }}
                                    className="flex items-start gap-3"
                                >
                                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <Check size={12} className="text-green-600" />
                                    </div>
                                    <span className="text-gray-700 text-sm">{benefit}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                    
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="relative"
                    >
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
                            <div className="space-y-6">
                                <div>
                                    <p className="text-blue-200 text-sm mb-1">Time Saved</p>
                                    <p className="text-4xl font-bold">5+ hours</p>
                                    <p className="text-blue-200 text-sm">per week on document search</p>
                                </div>
                                <div className="h-px bg-white/20" />
                                <div>
                                    <p className="text-blue-200 text-sm mb-1">Answer Accuracy</p>
                                    <p className="text-4xl font-bold">95%+</p>
                                    <p className="text-blue-200 text-sm">with source citations</p>
                                </div>
                                <div className="h-px bg-white/20" />
                                <div>
                                    <p className="text-blue-200 text-sm mb-1">Setup Time</p>
                                    <p className="text-4xl font-bold">&lt; 5 min</p>
                                    <p className="text-blue-200 text-sm">to get started</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Decorative elements */}
                        <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-200 rounded-2xl -z-10" />
                        <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-indigo-200 rounded-xl -z-10" />
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default BenefitsSection;
