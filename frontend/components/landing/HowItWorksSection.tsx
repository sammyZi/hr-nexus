"use client";

import { Upload, Search, FileText, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
    {
        number: "01",
        icon: Upload,
        title: "Upload Documents",
        description: "Drop your HR policies, employee handbooks, and guidelines into the system. We support PDF, Word, and text files."
    },
    {
        number: "02",
        icon: Search,
        title: "Ask Questions",
        description: "Type your questions in natural language, just like you'd ask a colleague. No special syntax needed."
    },
    {
        number: "03",
        icon: FileText,
        title: "Get Answers",
        description: "Receive accurate, AI-powered answers with exact citations so you can verify the source."
    }
];

const HowItWorksSection = () => {
    return (
        <section id="how-it-works" className="py-20 px-6 bg-gray-50">
            <div className="max-w-6xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-14"
                >
                    <p className="text-sm font-semibold text-blue-600 mb-2 uppercase tracking-wide">How It Works</p>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Three simple steps
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Get started in minutes. No complex setup required.
                    </p>
                </motion.div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {steps.map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.15 }}
                            className="relative"
                        >
                            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow h-full">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                                        <step.icon size={24} className="text-white" />
                                    </div>
                                    <span className="text-4xl font-bold text-gray-900">{step.number}</span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                                <p className="text-gray-600">{step.description}</p>
                            </div>
                            
                            {i < steps.length - 1 && (
                                <div className="hidden md:flex absolute top-1/2 -right-8 transform -translate-y-1/2 z-10">
                                    <ArrowRight size={28} className="text-blue-500" />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorksSection;
