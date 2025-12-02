"use client";

import { motion } from "framer-motion";
import { 
    Briefcase, 
    UserPlus, 
    DollarSign, 
    Heart, 
    GraduationCap, 
    Users, 
    TrendingUp, 
    UserMinus 
} from "lucide-react";

const pillars = [
    {
        icon: Briefcase,
        title: "Recruiting",
        description: "Manage candidate screening, interviews, and hiring processes",
        color: "from-blue-500 to-blue-600",
        bgColor: "bg-blue-50",
    },
    {
        icon: UserPlus,
        title: "Onboarding",
        description: "Streamline new hire orientation and documentation",
        color: "from-green-500 to-green-600",
        bgColor: "bg-green-50",
    },
    {
        icon: DollarSign,
        title: "Payroll",
        description: "Process salaries, deductions, and compensation",
        color: "from-emerald-500 to-emerald-600",
        bgColor: "bg-emerald-50",
    },
    {
        icon: Heart,
        title: "Benefits",
        description: "Manage health insurance, retirement, and perks",
        color: "from-pink-500 to-pink-600",
        bgColor: "bg-pink-50",
    },
    {
        icon: GraduationCap,
        title: "Learning & Development",
        description: "Training programs and skill development tracking",
        color: "from-purple-500 to-purple-600",
        bgColor: "bg-purple-50",
    },
    {
        icon: Users,
        title: "Employee Relations",
        description: "Handle workplace issues and team dynamics",
        color: "from-orange-500 to-orange-600",
        bgColor: "bg-orange-50",
    },
    {
        icon: TrendingUp,
        title: "Performance",
        description: "Reviews, goals, and performance tracking",
        color: "from-indigo-500 to-indigo-600",
        bgColor: "bg-indigo-50",
    },
    {
        icon: UserMinus,
        title: "Offboarding",
        description: "Exit interviews and separation processes",
        color: "from-red-500 to-red-600",
        bgColor: "bg-red-50",
    },
];

const PillarsSection = () => {
    return (
        <section id="pillars" className="py-20 px-6 bg-gray-50">
            <div className="max-w-6xl mx-auto">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-14"
                >
                    <p className="text-sm font-semibold text-blue-600 mb-2 uppercase tracking-wide">HR Pillars</p>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Complete HR Management
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Manage all aspects of human resources with dedicated modules for each HR function.
                    </p>
                </motion.div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {pillars.map((pillar, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05 }}
                            whileHover={{ y: -5, scale: 1.02 }}
                            className={`p-5 ${pillar.bgColor} rounded-2xl border border-gray-100 hover:shadow-lg transition-all cursor-pointer group`}
                        >
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pillar.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                <pillar.icon size={22} className="text-white" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">{pillar.title}</h3>
                            <p className="text-sm text-gray-600">{pillar.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PillarsSection;
