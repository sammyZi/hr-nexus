"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
            setMobileMenuOpen(false);
        }
    };

    return (
        <>
            <motion.nav 
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className={`fixed top-2 sm:top-3 left-2 right-2 sm:left-4 sm:right-4 lg:left-0 lg:right-0 lg:mx-auto lg:w-fit z-50 transition-all duration-300 rounded-xl sm:rounded-2xl ${
                    scrolled 
                        ? "bg-white/30 border-2 border-white/30 shadow-xl shadow-gray-300/20" 
                        : "bg-white/20 border-2 border-white/20"
                }`}
                style={{
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)"
                }}
            >
                <div className="px-3 sm:px-6 py-2.5 sm:py-3">
                    <div className="flex items-center justify-between lg:gap-10">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                                <span className="text-white font-bold text-xs sm:text-sm">H</span>
                            </div>
                            <motion.span 
                                className="font-bold text-base sm:text-lg bg-clip-text text-transparent"
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
                        
                        {/* Desktop Nav Links */}
                        <div className="hidden lg:flex items-center gap-8">
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
                        
                        {/* Auth Buttons - Desktop */}
                        <div className="hidden sm:flex items-center gap-2 sm:gap-4">
                            <Link 
                                href="/signin"
                                className="px-3 sm:px-4 py-1.5 sm:py-2 text-gray-700 hover:text-blue-600 text-xs sm:text-sm font-medium transition-colors"
                            >
                                Login
                            </Link>
                            <Link 
                                href="/signup"
                                className="px-3 sm:px-5 py-1.5 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
                            >
                                Get Started
                            </Link>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed top-16 sm:top-20 left-2 right-2 sm:left-4 sm:right-4 z-40 lg:hidden"
                    >
                        <div className="bg-white/95 backdrop-blur-xl rounded-xl border-2 border-gray-200 shadow-2xl p-4">
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={() => scrollToSection("features")}
                                    className="text-left px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-base font-medium transition-all"
                                >
                                    Features
                                </button>
                                <button 
                                    onClick={() => scrollToSection("pillars")}
                                    className="text-left px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-base font-medium transition-all"
                                >
                                    HR Pillars
                                </button>
                                <button 
                                    onClick={() => scrollToSection("how-it-works")}
                                    className="text-left px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-base font-medium transition-all"
                                >
                                    How it Works
                                </button>
                                <button 
                                    onClick={() => scrollToSection("benefits")}
                                    className="text-left px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-base font-medium transition-all"
                                >
                                    Benefits
                                </button>
                                <div className="h-px bg-gray-200 my-2" />
                                <Link 
                                    href="/signin"
                                    className="px-4 py-3 text-center text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-base font-medium transition-all"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Login
                                </Link>
                                <Link 
                                    href="/signup"
                                    className="px-4 py-3 text-center bg-blue-600 text-white text-base font-medium rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Get Started
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
