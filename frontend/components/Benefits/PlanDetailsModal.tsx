"use client";

import { X, Shield, Calendar, DollarSign, Users, CheckCircle, FileText } from "lucide-react";
import { BenefitPlan } from "@/lib/api";

interface PlanDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: BenefitPlan | null;
}

export default function PlanDetailsModal({ isOpen, onClose, plan }: PlanDetailsModalProps) {
    if (!isOpen || !plan) return null;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Shield className="text-white" size={24} />
                        <h2 className="text-xl font-bold text-white">Plan Details</h2>
                    </div>
                    <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                    <div className="space-y-6">
                        {/* Plan Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Information</h3>
                            <div className="bg-rose-50 rounded-xl p-4 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Plan Name:</span>
                                    <span className="font-semibold text-gray-900">{plan.plan_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Benefit Type:</span>
                                    <span className="font-semibold text-rose-600">{plan.benefit_type}</span>
                                </div>
                                {plan.provider && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Provider:</span>
                                        <span className="font-semibold text-gray-900">{plan.provider}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Coverage Level:</span>
                                    <span className="font-semibold text-gray-900">{plan.coverage_level}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Status:</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${plan.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                                        }`}>
                                        {plan.is_active ? "Active" : "Inactive"}
                                    </span>
                                </div>
                            </div>
                            <p className="text-gray-700 mt-4">{plan.description}</p>
                        </div>

                        {/* Cost Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white border border-rose-200 rounded-xl p-4">
                                    <p className="text-sm text-gray-600 mb-1">Monthly Premium</p>
                                    <p className="text-2xl font-bold text-rose-600">{formatCurrency(plan.monthly_premium)}</p>
                                </div>
                                <div className="bg-white border border-rose-200 rounded-xl p-4">
                                    <p className="text-sm text-gray-600 mb-1">Employer Contribution</p>
                                    <p className="text-2xl font-bold text-green-600">{formatCurrency(plan.employer_contribution)}</p>
                                </div>
                                <div className="bg-white border border-rose-200 rounded-xl p-4">
                                    <p className="text-sm text-gray-600 mb-1">Employee Contribution</p>
                                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(plan.employee_contribution)}</p>
                                </div>
                                {plan.deductible && plan.deductible > 0 && (
                                    <div className="bg-white border border-rose-200 rounded-xl p-4">
                                        <p className="text-sm text-gray-600 mb-1">Deductible</p>
                                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(plan.deductible)}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Plan Dates */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Dates</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Plan Year</p>
                                    <p className="font-semibold text-gray-900">{formatDate(plan.plan_year_start)} - {formatDate(plan.plan_year_end)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Enrollment Period</p>
                                    <p className="font-semibold text-gray-900">{formatDate(plan.enrollment_start)} - {formatDate(plan.enrollment_end)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Enrollment Info */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Information</h3>
                            <div className="bg-rose-50 rounded-xl p-4 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Current Enrollments:</span>
                                    <span className="font-semibold text-gray-900">{plan.current_enrollments}</span>
                                </div>
                                {plan.max_enrollments && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Max Enrollments:</span>
                                        <span className="font-semibold text-gray-900">{plan.max_enrollments}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Eligibility:</span>
                                    <span className="font-semibold text-gray-900">{plan.eligibility_criteria}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Waiting Period:</span>
                                    <span className="font-semibold text-gray-900">{plan.waiting_period_days} days</span>
                                </div>
                            </div>
                        </div>

                        {/* Features */}
                        {plan.features && plan.features.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
                                <ul className="space-y-2">
                                    {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <CheckCircle size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-gray-700">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {plan.notes && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                                <p className="text-gray-700 bg-gray-50 rounded-xl p-4">{plan.notes}</p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
