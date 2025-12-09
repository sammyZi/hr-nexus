import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, Clock, FileText } from "lucide-react";

interface StatsCardsProps {
    totalCases: number;
    openCases: number;
    resolvedThisMonth: number;
    avgResolutionDays: number;
}

export const StatsCards = ({ totalCases, openCases, resolvedThisMonth, avgResolutionDays }: StatsCardsProps) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-indigo-50 rounded-xl">
                        <FileText className="w-6 h-6 text-indigo-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-500">Total Cases</span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900">{totalCases}</h3>
                <p className="text-sm text-gray-500 mt-1">Recorded to date</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-orange-50 rounded-xl">
                        <AlertCircle className="w-6 h-6 text-orange-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-500">Active Cases</span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900">{openCases}</h3>
                <p className="text-sm text-gray-500 mt-1">Requires attention</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-50 rounded-xl">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-500">Resolved</span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900">{resolvedThisMonth}</h3>
                <p className="text-sm text-gray-500 mt-1">This month</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-indigo-50 rounded-xl">
                        <Clock className="w-6 h-6 text-indigo-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-500">Avg Time</span>
                </div>
                <h3 className="text-3xl font-bold text-gray-900">{avgResolutionDays}d</h3>
                <p className="text-sm text-gray-500 mt-1">To resolution</p>
            </motion.div>
        </div>
    );
};
