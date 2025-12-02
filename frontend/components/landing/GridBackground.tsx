"use client";

import { motion } from "framer-motion";

export default function GridBackground() {
    return (
        <div className="absolute inset-0 z-0" aria-hidden="true">
            {/* White background base */}
            <div className="absolute inset-0 bg-white" />
            
            {/* Base Grid Pattern - 60px - DARKER */}
            <div 
                className="absolute inset-0"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgba(150, 150, 150, 0.35) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(150, 150, 150, 0.35) 1px, transparent 1px)
                    `,
                    backgroundSize: '60px 60px'
                }}
            />
            
            {/* Accent Grid Pattern - 20px - DARKER */}
            <div 
                className="absolute inset-0"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgba(170, 170, 170, 0.18) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(170, 170, 170, 0.18) 1px, transparent 1px)
                    `,
                    backgroundSize: '20px 20px'
                }}
            />
            
            {/* Animated Orbs with Orange/Teal Animation */}
            {/* Top Center Orb - Orange to Teal */}
            <motion.div
                className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none"
                animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.6, 0.85, 0.6],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            >
                <motion.div
                    className="absolute inset-0 rounded-full blur-3xl"
                    animate={{
                        background: [
                            'radial-gradient(circle, rgba(249, 115, 22, 0.5) 0%, rgba(251, 146, 60, 0.25) 50%, transparent 100%)',
                            'radial-gradient(circle, rgba(20, 184, 166, 0.5) 0%, rgba(45, 212, 191, 0.25) 50%, transparent 100%)',
                            'radial-gradient(circle, rgba(249, 115, 22, 0.5) 0%, rgba(251, 146, 60, 0.25) 50%, transparent 100%)',
                        ]
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            </motion.div>
            
            {/* Top Right Orb - Teal to Orange */}
            <motion.div
                className="absolute top-[20%] right-[20%] w-[550px] h-[550px] rounded-full blur-3xl pointer-events-none"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 0.9, 0.7],
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            >
                <motion.div
                    className="absolute inset-0 rounded-full blur-3xl"
                    animate={{
                        background: [
                            'radial-gradient(circle, rgba(20, 184, 166, 0.55) 0%, rgba(45, 212, 191, 0.3) 50%, transparent 100%)',
                            'radial-gradient(circle, rgba(249, 115, 22, 0.55) 0%, rgba(251, 146, 60, 0.3) 50%, transparent 100%)',
                            'radial-gradient(circle, rgba(20, 184, 166, 0.55) 0%, rgba(45, 212, 191, 0.3) 50%, transparent 100%)',
                        ]
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            </motion.div>
            
            {/* Bottom Left Orb - Orange to Teal */}
            <motion.div
                className="absolute bottom-[15%] left-[15%] w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none"
                animate={{
                    scale: [1.1, 1, 1.1],
                    opacity: [0.7, 0.9, 0.7],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            >
                <motion.div
                    className="absolute inset-0 rounded-full blur-3xl"
                    animate={{
                        background: [
                            'radial-gradient(circle, rgba(249, 115, 22, 0.6) 0%, rgba(251, 146, 60, 0.3) 50%, transparent 100%)',
                            'radial-gradient(circle, rgba(20, 184, 166, 0.6) 0%, rgba(45, 212, 191, 0.3) 50%, transparent 100%)',
                            'radial-gradient(circle, rgba(249, 115, 22, 0.6) 0%, rgba(251, 146, 60, 0.3) 50%, transparent 100%)',
                        ]
                    }}
                    transition={{
                        duration: 12,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            </motion.div>
            
            {/* Center Orb - Teal to Orange */}
            <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full blur-3xl pointer-events-none"
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.6, 0.8, 0.6],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            >
                <motion.div
                    className="absolute inset-0 rounded-full blur-3xl"
                    animate={{
                        background: [
                            'radial-gradient(circle, rgba(20, 184, 166, 0.45) 0%, rgba(45, 212, 191, 0.2) 50%, transparent 100%)',
                            'radial-gradient(circle, rgba(249, 115, 22, 0.45) 0%, rgba(251, 146, 60, 0.2) 50%, transparent 100%)',
                            'radial-gradient(circle, rgba(20, 184, 166, 0.45) 0%, rgba(45, 212, 191, 0.2) 50%, transparent 100%)',
                        ]
                    }}
                    transition={{
                        duration: 14,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            </motion.div>
            
            {/* Grid fade out at edges */}
            <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `
                        radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(255,255,255,0.3) 75%, rgba(255,255,255,0.9) 100%),
                        linear-gradient(to right, rgba(255,255,255,0.95) 0%, transparent 15%, transparent 85%, rgba(255,255,255,0.95) 100%),
                        linear-gradient(to bottom, rgba(255,255,255,0.95) 0%, transparent 15%, transparent 85%, rgba(255,255,255,0.95) 100%)
                    `
                }}
            />
        </div>
    );
}
