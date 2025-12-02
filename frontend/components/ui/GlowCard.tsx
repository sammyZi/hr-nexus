"use client";

import { ReactNode } from "react";

interface GlowCardProps {
    children: ReactNode;
    glowColor?: string;
    className?: string;
}

export function GlowCard({ children, glowColor = "blue", className = "" }: GlowCardProps) {
    const glowColors = {
        blue: "group-hover:shadow-blue-500/50",
        purple: "group-hover:shadow-purple-500/50",
        green: "group-hover:shadow-green-500/50",
        orange: "group-hover:shadow-orange-500/50",
        pink: "group-hover:shadow-pink-500/50",
    };

    return (
        <div className={`group relative ${className}`}>
            <div className={`absolute -inset-0.5 bg-gradient-to-r from-${glowColor}-500 to-${glowColor}-600 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-500`} />
            <div className="relative bg-white rounded-2xl">
                {children}
            </div>
        </div>
    );
}
