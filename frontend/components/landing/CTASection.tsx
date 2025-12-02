"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const CTASection = () => {
    return (
        <section className="py-20 px-6 bg-gray-900">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="max-w-4xl mx-auto text-center"
            >
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Ready to transform your HR workflow?
                </h2>
                <p className="text-gray-400 mb-8 text-lg">
                    Create your organization and start asking questions in minutes. No credit card required.
                </p>
                <div className="flex items-center justify-center gap-4">
                    <Link 
                        href="/signup"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-lg"
                    >
                        Get Started Free
                        <ArrowRight size={18} />
                    </Link>
                    <Link 
                        href="/signin"
                        className="inline-flex items-center gap-2 px-8 py-4 text-white font-semibold rounded-xl border border-gray-700 hover:bg-gray-800 transition-all"
                    >
                        Sign In
                    </Link>
                </div>
            </motion.div>
        </section>
    );
};

export default CTASection;
