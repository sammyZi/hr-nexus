"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <motion.nav 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`fixed top-3 left-0 right-0 mx-auto w-fit z-50 transition-all duration-300 rounded-2xl ${
                scrolled 
                    ? "bg-white/50 border-2 border-gray-200/50 shadow-xl shadow-gray-300/20" 
                    : "bg-white/40 border-2 border-gray-200/40"
            }`}
            style={{
                backdropFilter: "blur(60px)",
                WebkitBackdropFilter: "blur(60px)"
            }}
        >
            <div className="px-6 py-3">
                <div className="flex items-center gap-10">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                            <span className="text-white font-bold text-sm">H</span>
                        </div>
                        <motion.span 
                            className="font-bold text-lg bg-clip-text text-transparent"
                            style={{
                                backgroundImage: "linear-gradient(90deg, #2563eb, #7c3aed, #db2777, #7c3aed, #2563eb)",
                                backgroundSize: "200% 100%",
                            }}
                            animate={{
                                backgroundPosition: ["0% 0%", "200% 0%"],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                        >
                            HR Nexus
                        </motion.span>
                    </Link>
                    
                    {/* Nav Links */}
                    <div className="hidden md:flex items-center gap-8">
                        <button 
                            onClick={() => scrollToSection("features")}
                            className="text-gray-700 hover:text-blue-600 text-base font-medium transition-colors"
                        >
                            Features
                        </button>
                        <button 
                            onClick={() => scrollToSection("pillars")}
                            className="text-gray-700 hover:text-blue-600 text-base font-medium transition-colors"
                        >
                            HR Pillars
                        </button>
                        <button 
                            onClick={() => scrollToSection("how-it-works")}
                            className="text-gray-700 hover:text-blue-600 text-base font-medium transition-colors"
                        >
                            How it Works
                        </button>
                        <button 
                            onClick={() => scrollToSection("benefits")}
                            className="text-gray-700 hover:text-blue-600 text-base font-medium transition-colors"
                        >
                            Benefits
                        </button>
                    </div>
                    
                    {/* Auth Buttons */}
                    <div className="flex items-center gap-4">
                        <Link 
                            href="/signin"
                            className="px-4 py-2 text-gray-700 hover:text-blue-600 text-sm font-medium transition-colors"
                        >
                            Login
                        </Link>
                        <Link 
                            href="/signup"
                            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </div>
        </motion.nav>
    );
};

export default Navbar;
