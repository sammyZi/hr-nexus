"use client";

import { X, Users, Calendar, DollarSign, Shield, FileText } from "lucide-react";
import { BenefitEnrollment } from "@/lib/api";

interface EnrollmentDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    enrollment: BenefitEnrollment | null;
}

export default function EnrollmentDetailsModal({ isOpen, onClose, enrollment }: EnrollmentDetailsModalProps) {
    if (!isOpen || !enrollment) return null;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const STATUS_COLORS: Record<string, string> = {
        "Pending": "bg-yellow-100 text-yellow-700",
        "Active": "bg-green-100 text-green-700",
        "Declined": "bg-red-100 text-red-700",
        "Terminated": "bg-gray-100 text-gray-700",
        "Expired": "bg-orange-100 text-orange-700",
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Users className="text-white" size={24} />
                        <h2 className="text-xl font-bold text-white">Enrollment Details</h2>
                    </div>
                    <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                    <div className="space-y-6">
                        {/* Employee Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Information</h3>
                            <div className="bg-rose-50 rounded-xl p-4 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Name:</span>
                                    <span className="font-semibold text-gray-900">{enrollment.employee_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Email:</span>
                                    <span className="font-semibold text-gray-900">{enrollment.employee_email}</span>
                                </div>
                                {enrollment.department && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Department:</span>
                                        <span className="font-semibold text-gray-900">{enrollment.department}</span>
                                    </div>
                                )}
                                {enrollment.position && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Position:</span>
                                        <span className="font-semibold text-gray-900">{enrollment.position}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Plan Information */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Information</h3>
                            <div className="bg-white border border-rose-200 rounded-xl p-4 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Plan Name:</span>
                                    <span className="font-semibold text-gray-900">{enrollment.plan_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Benefit Type:</span>
                                    <span className="font-semibold text-rose-600">{enrollment.benefit_type}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Coverage Level:</span>
                                    <span className="font-semibold text-gray-900">{enrollment.coverage_level}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Status:</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[enrollment.status]}`}>
                                        {enrollment.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Enrollment Dates */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Dates</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Enrollment Date</p>
                                    <p className="font-semibold text-gray-900">{formatDate(enrollment.enrollment_date)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Effective Date</p>
                                    <p className="font-semibold text-gray-900">{formatDate(enrollment.effective_date)}</p>
                                </div>
                                {enrollment.termination_date && (
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Termination Date</p>
                                        <p className="font-semibold text-gray-900">{formatDate(enrollment.termination_date)}</p>
                                    </div>
                                )}
                                {enrollment.deduction_start_date && (
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Deduction Start</p>
                                        <p className="font-semibold text-gray-900">{formatDate(enrollment.deduction_start_date)}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Cost Breakdown */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white border border-rose-200 rounded-xl p-4">
                                    <p className="text-sm text-gray-600 mb-1">Monthly Premium</p>
                                    <p className="text-2xl font-bold text-rose-600">{formatCurrency(enrollment.monthly_premium)}</p>
                                </div>
                                <div className="bg-white border border-rose-200 rounded-xl p-4">
                                    <p className="text-sm text-gray-600 mb-1">Annual Cost</p>
                                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(enrollment.annual_cost)}</p>
                                </div>
                                <div className="bg-white border border-rose-200 rounded-xl p-4">
                                    <p className="text-sm text-gray-600 mb-1">Employer Contribution</p>
                                    <p className="text-xl font-bold text-green-600">{formatCurrency(enrollment.employer_contribution)}</p>
                                </div>
                                <div className="bg-white border border-rose-200 rounded-xl p-4">
                                    <p className="text-sm text-gray-600 mb-1">Employee Contribution</p>
                                    <p className="text-xl font-bold text-blue-600">{formatCurrency(enrollment.employee_contribution)}</p>
                                </div>
                            </div>
                            <div className="mt-4 bg-rose-50 rounded-xl p-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Payment Frequency:</span>
                                    <span className="font-semibold text-gray-900">{enrollment.payment_frequency}</span>
                                </div>
                            </div>
                        </div>

                        {/* Dependents */}
                        {enrollment.dependents && enrollment.dependents.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Dependents</h3>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-gray-700">{enrollment.dependents.length} dependent(s) covered</p>
                                </div>
                            </div>
                        )}

                        {enrollment.notes && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                                <p className="text-gray-700 bg-gray-50 rounded-xl p-4">{enrollment.notes}</p>
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
