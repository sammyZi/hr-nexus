"use client";

import Link from "next/link";

const Footer = () => {
    return (
        <footer className="py-8 px-6 bg-white border-t border-gray-100">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">H</span>
                        </div>
                        <span className="text-gray-500 text-sm">© 2024 HR Nexus. All rights reserved.</span>
                    </div>
                    <div className="flex items-center gap-8 text-sm text-gray-500">
                        <Link href="/signin" className="hover:text-gray-900 transition-colors">Login</Link>
                        <Link href="/signup" className="hover:text-gray-900 transition-colors">Sign Up</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
