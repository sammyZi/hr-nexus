"use client";

import { motion } from "framer-motion";

const CheckeredGrid = () => {
    return (
        <div className="absolute inset-0 -z-10" aria-hidden="true">
            {/* Background */}
            <div className="absolute inset-0 bg-white" />
            
            {/* Base Grid Pattern - 60px - DARK */}
            <div 
                className="absolute inset-0"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, #9ca3af 1px, transparent 1px),
                        linear-gradient(to bottom, #9ca3af 1px, transparent 1px)
                    `,
                    backgroundSize: '60px 60px'
                }}
            />
            
            {/* Accent Grid Pattern - 20px */}
            <div 
                className="absolute inset-0"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, #d1d5db 1px, transparent 1px),
                        linear-gradient(to bottom, #d1d5db 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px'
                }}
            />
            
            {/* Animated Orbs */}
            <motion.div
                className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, rgba(59, 130, 246, 0.15) 50%, transparent 100%)',
                }}
                animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.7, 0.9, 0.7],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />
            
            <motion.div
                className="absolute top-[20%] right-[20%] w-[550px] h-[550px] rounded-full blur-3xl pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.35) 0%, rgba(59, 130, 246, 0.15) 50%, transparent 100%)',
                }}
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.8, 0.95, 0.8],
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />
            
            <motion.div
                className="absolute bottom-[15%] left-[15%] w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, rgba(168, 85, 247, 0.2) 50%, transparent 100%)',
                }}
                animate={{
                    scale: [1.1, 1, 1.1],
                    opacity: [0.8, 0.95, 0.8],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />
            
            <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full blur-3xl pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.15) 50%, transparent 100%)',
                }}
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.6, 0.75, 0.6],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            />
            
            <motion.div
                className="absolute bottom-[10%] right-[15%] w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, rgba(236, 72, 153, 0.1) 50%, transparent 100%)',
                }}
                animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.5, 0.7, 0.5],
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />
            
            {/* Edge fade - only at very edges */}
            <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(ellipse at center, transparent 0%, transparent 70%, rgba(255,255,255,0.8) 100%)'
            }} />
        </div>
    );
};

export default CheckeredGrid;
