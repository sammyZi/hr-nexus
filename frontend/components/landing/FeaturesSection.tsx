"use client";

import { FileText, MessageSquare, Shield, Zap, Users, FolderOpen } from "lucide-react";
import { motion } from "framer-motion";

const features = [
    {
        icon: MessageSquare,
        title: "Natural Language Search",
        description: "Ask questions in plain English. No complex queries needed.",
        color: "from-blue-500 to-blue-600"
    },
    {
        icon: FileText,
        title: "Document Support",
        description: "Upload PDFs, Word docs, and text files. All formats supported.",
        color: "from-indigo-500 to-indigo-600"
    },
    {
        icon: Zap,
        title: "Instant Answers",
        description: "Get responses in seconds with AI-powered search.",
        color: "from-purple-500 to-purple-600"
    },
    {
        icon: Shield,
        title: "Source Citations",
        description: "Every answer includes the exact source and page number.",
        color: "from-cyan-500 to-cyan-600"
    },
    {
        icon: Users,
        title: "Team Collaboration",
        description: "Invite team members and manage access by organization.",
        color: "from-emerald-500 to-emerald-600"
    },
    {
        icon: FolderOpen,
        title: "Task Management",
        description: "Create and track HR tasks across different categories.",
        color: "from-orange-500 to-orange-600"
    }
];

const FeaturesSection = () => {
    return (
        <section id="features" className="py-20 px-6 bg-white">
            <div className="max-w-6xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-14"
                >
                    <p className="text-sm font-semibold text-blue-600 mb-2 uppercase tracking-wide">Features</p>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Everything you need for HR
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Powerful features to help you manage documents, answer questions, and streamline HR operations.
                    </p>
                </motion.div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all group"
                        >
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                <feature.icon size={22} className="text-white" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                            <p className="text-sm text-gray-600">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
