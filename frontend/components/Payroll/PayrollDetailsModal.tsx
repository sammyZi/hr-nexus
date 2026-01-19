"use client";

import { X, DollarSign, Calendar, User, Building2, CreditCard, TrendingUp, TrendingDown, CheckCircle } from "lucide-react";
import { PayrollRecord } from "@/lib/api";

interface PayrollDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    record: PayrollRecord | null;
}

export default function PayrollDetailsModal({ isOpen, onClose, record }: PayrollDetailsModalProps) {
    if (!isOpen || !record) return null;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Payroll Details</h2>
                            <p className="text-emerald-100 text-sm">{record.employee_name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                    {/* Employee Information */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <User size={20} className="text-emerald-600" />
                            Employee Information
                        </h3>
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Employee ID:</span>
                                <span className="font-semibold text-gray-900">{record.employee_id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Name:</span>
                                <span className="font-semibold text-gray-900">{record.employee_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Email:</span>
                                <span className="font-semibold text-gray-900">{record.employee_email}</span>
                            </div>
                            {record.department && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Department:</span>
                                    <span className="font-semibold text-gray-900">{record.department}</span>
                                </div>
                            )}
                            {record.position && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Position:</span>
                                    <span className="font-semibold text-gray-900">{record.position}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pay Period */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Calendar size={20} className="text-emerald-600" />
                            Pay Period
                        </h3>
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Period Start:</span>
                                <span className="font-semibold text-gray-900">{formatDate(record.pay_period_start)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Period End:</span>
                                <span className="font-semibold text-gray-900">{formatDate(record.pay_period_end)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Payment Date:</span>
                                <span className="font-semibold text-gray-900">{formatDate(record.payment_date)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Compensation Breakdown */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <TrendingUp size={20} className="text-emerald-600" />
                            Compensation Breakdown
                        </h3>
                        <div className="bg-emerald-50 rounded-xl p-4 space-y-3 border border-emerald-200">
                            <div className="flex justify-between">
                                <span className="text-gray-700">Base Salary:</span>
                                <span className="font-semibold text-gray-900">{formatCurrency(record.base_salary)}</span>
                            </div>
                            {record.overtime_hours > 0 && (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-gray-700">Overtime ({record.overtime_hours} hrs @ {formatCurrency(record.overtime_rate)}/hr):</span>
                                        <span className="font-semibold text-gray-900">{formatCurrency(record.overtime_pay)}</span>
                                    </div>
                                </>
                            )}
                            {record.bonus > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-700">Bonus:</span>
                                    <span className="font-semibold text-gray-900">{formatCurrency(record.bonus)}</span>
                                </div>
                            )}
                            {record.commission > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-700">Commission:</span>
                                    <span className="font-semibold text-gray-900">{formatCurrency(record.commission)}</span>
                                </div>
                            )}
                            <div className="h-px bg-emerald-300"></div>
                            <div className="flex justify-between">
                                <span className="text-gray-900 font-semibold">Gross Pay:</span>
                                <span className="text-xl font-bold text-emerald-600">{formatCurrency(record.gross_pay)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Deductions Breakdown */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <TrendingDown size={20} className="text-red-600" />
                            Deductions Breakdown
                        </h3>
                        <div className="bg-red-50 rounded-xl p-4 space-y-3 border border-red-200">
                            {record.tax_deduction > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-700">Tax Deduction:</span>
                                    <span className="font-semibold text-gray-900">{formatCurrency(record.tax_deduction)}</span>
                                </div>
                            )}
                            {record.health_insurance > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-700">Health Insurance:</span>
                                    <span className="font-semibold text-gray-900">{formatCurrency(record.health_insurance)}</span>
                                </div>
                            )}
                            {record.retirement_contribution > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-700">Retirement Contribution:</span>
                                    <span className="font-semibold text-gray-900">{formatCurrency(record.retirement_contribution)}</span>
                                </div>
                            )}
                            {record.other_deductions > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-700">Other Deductions:</span>
                                    <span className="font-semibold text-gray-900">{formatCurrency(record.other_deductions)}</span>
                                </div>
                            )}
                            <div className="h-px bg-red-300"></div>
                            <div className="flex justify-between">
                                <span className="text-gray-900 font-semibold">Total Deductions:</span>
                                <span className="text-xl font-bold text-red-600">{formatCurrency(record.total_deductions)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Net Pay */}
                    <div className="mb-6">
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-emerald-100 text-sm mb-1">Net Pay</p>
                                    <p className="text-4xl font-bold">{formatCurrency(record.net_pay)}</p>
                                </div>
                                <CheckCircle size={48} className="text-white/40" />
                            </div>
                        </div>
                    </div>

                    {/* Payment Details */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <CreditCard size={20} className="text-emerald-600" />
                            Payment Details
                        </h3>
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Payment Method:</span>
                                <span className="font-semibold text-gray-900">{record.payment_method}</span>
                            </div>
                            {record.bank_account_last4 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Account (Last 4):</span>
                                    <span className="font-semibold text-gray-900">****{record.bank_account_last4}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-600">Status:</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${record.status === "Paid" ? "bg-emerald-100 text-emerald-700" :
                                        record.status === "Approved" ? "bg-blue-100 text-blue-700" :
                                            record.status === "Draft" ? "bg-gray-100 text-gray-700" :
                                                "bg-yellow-100 text-yellow-700"
                                    }`}>
                                    {record.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {record.notes && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-gray-700">{record.notes}</p>
                            </div>
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                            <span>Created:</span>
                            <span>{formatDate(record.created_at)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Last Updated:</span>
                            <span>{formatDate(record.updated_at)}</span>
                        </div>
                        {record.approved_at && (
                            <div className="flex justify-between">
                                <span>Approved:</span>
                                <span>{formatDate(record.approved_at)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
