"use client";

import { useState, useEffect } from "react";
import { X, DollarSign, Calendar, User, Building2, CreditCard, Calculator } from "lucide-react";
import { PayrollCreate, PayrollRecord } from "@/lib/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface PayrollModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: PayrollCreate) => void;
    title: string;
    initialData?: PayrollRecord;
}

export default function PayrollModal({ isOpen, onClose, onSubmit, title, initialData }: PayrollModalProps) {
    const [formData, setFormData] = useState<PayrollCreate>({
        employee_id: "",
        employee_name: "",
        employee_email: "",
        department: "",
        position: "",
        pay_period_start: new Date().toISOString(),
        pay_period_end: new Date().toISOString(),
        payment_date: new Date().toISOString(),
        base_salary: 0,
        overtime_hours: 0,
        overtime_rate: 0,
        bonus: 0,
        commission: 0,
        tax_deduction: 0,
        health_insurance: 0,
        retirement_contribution: 0,
        other_deductions: 0,
        payment_method: "Direct Deposit",
        bank_account_last4: "",
        notes: "",
    });

    // Calculated values
    const [calculations, setCalculations] = useState({
        overtime_pay: 0,
        gross_pay: 0,
        total_deductions: 0,
        net_pay: 0,
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                employee_id: initialData.employee_id,
                employee_name: initialData.employee_name,
                employee_email: initialData.employee_email,
                department: initialData.department || "",
                position: initialData.position || "",
                pay_period_start: initialData.pay_period_start,
                pay_period_end: initialData.pay_period_end,
                payment_date: initialData.payment_date,
                base_salary: initialData.base_salary,
                overtime_hours: initialData.overtime_hours,
                overtime_rate: initialData.overtime_rate,
                bonus: initialData.bonus,
                commission: initialData.commission,
                tax_deduction: initialData.tax_deduction,
                health_insurance: initialData.health_insurance,
                retirement_contribution: initialData.retirement_contribution,
                other_deductions: initialData.other_deductions,
                payment_method: initialData.payment_method,
                bank_account_last4: initialData.bank_account_last4 || "",
                notes: initialData.notes || "",
            });
        }
    }, [initialData]);

    // Recalculate totals whenever form data changes
    useEffect(() => {
        const overtime_pay = (formData.overtime_hours || 0) * (formData.overtime_rate || 0);
        const gross_pay = (formData.base_salary || 0) + overtime_pay + (formData.bonus || 0) + (formData.commission || 0);
        const total_deductions = (formData.tax_deduction || 0) + (formData.health_insurance || 0) + (formData.retirement_contribution || 0) + (formData.other_deductions || 0);
        const net_pay = gross_pay - total_deductions;

        setCalculations({
            overtime_pay,
            gross_pay,
            total_deductions,
            net_pay,
        });
    }, [formData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleChange = (field: keyof PayrollCreate, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <DollarSign size={24} />
                        </div>
                        <h2 className="text-xl font-bold">{title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                    {/* Employee Information */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <User size={20} className="text-emerald-600" />
                            Employee Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Employee ID <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.employee_id}
                                    onChange={(e) => handleChange("employee_id", e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    placeholder="EMP001"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Employee Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.employee_name}
                                    onChange={(e) => handleChange("employee_name", e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.employee_email}
                                    onChange={(e) => handleChange("employee_email", e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    placeholder="john.doe@company.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Department
                                </label>
                                <input
                                    type="text"
                                    value={formData.department}
                                    onChange={(e) => handleChange("department", e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    placeholder="Engineering"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Position
                                </label>
                                <input
                                    type="text"
                                    value={formData.position}
                                    onChange={(e) => handleChange("position", e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    placeholder="Senior Software Engineer"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pay Period */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Calendar size={20} className="text-emerald-600" />
                            Pay Period
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Period Start <span className="text-red-500">*</span>
                                </label>
                                <DatePicker
                                    selected={new Date(formData.pay_period_start)}
                                    onChange={(date) => handleChange("pay_period_start", date?.toISOString() || new Date().toISOString())}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    dateFormat="MM/dd/yyyy"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Period End <span className="text-red-500">*</span>
                                </label>
                                <DatePicker
                                    selected={new Date(formData.pay_period_end)}
                                    onChange={(date) => handleChange("pay_period_end", date?.toISOString() || new Date().toISOString())}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    dateFormat="MM/dd/yyyy"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Date <span className="text-red-500">*</span>
                                </label>
                                <DatePicker
                                    selected={new Date(formData.payment_date)}
                                    onChange={(date) => handleChange("payment_date", date?.toISOString() || new Date().toISOString())}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    dateFormat="MM/dd/yyyy"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Compensation */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <DollarSign size={20} className="text-emerald-600" />
                            Compensation
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Base Salary <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={formData.base_salary}
                                    onChange={(e) => handleChange("base_salary", parseFloat(e.target.value) || 0)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    placeholder="5000.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Overtime Hours
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={formData.overtime_hours}
                                    onChange={(e) => handleChange("overtime_hours", parseFloat(e.target.value) || 0)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Overtime Rate (per hour)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.overtime_rate}
                                    onChange={(e) => handleChange("overtime_rate", parseFloat(e.target.value) || 0)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Overtime Pay (Calculated)
                                </label>
                                <div className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 font-semibold">
                                    {formatCurrency(calculations.overtime_pay)}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bonus
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.bonus}
                                    onChange={(e) => handleChange("bonus", parseFloat(e.target.value) || 0)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Commission
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.commission}
                                    onChange={(e) => handleChange("commission", parseFloat(e.target.value) || 0)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Deductions */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Calculator size={20} className="text-emerald-600" />
                            Deductions
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tax Deduction
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.tax_deduction}
                                    onChange={(e) => handleChange("tax_deduction", parseFloat(e.target.value) || 0)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Health Insurance
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.health_insurance}
                                    onChange={(e) => handleChange("health_insurance", parseFloat(e.target.value) || 0)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Retirement Contribution
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.retirement_contribution}
                                    onChange={(e) => handleChange("retirement_contribution", parseFloat(e.target.value) || 0)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Other Deductions
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.other_deductions}
                                    onChange={(e) => handleChange("other_deductions", parseFloat(e.target.value) || 0)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Payment Details */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <CreditCard size={20} className="text-emerald-600" />
                            Payment Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Method
                                </label>
                                <select
                                    value={formData.payment_method}
                                    onChange={(e) => handleChange("payment_method", e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                >
                                    <option value="Direct Deposit">Direct Deposit</option>
                                    <option value="Check">Check</option>
                                    <option value="Cash">Cash</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bank Account (Last 4 digits)
                                </label>
                                <input
                                    type="text"
                                    maxLength={4}
                                    value={formData.bank_account_last4}
                                    onChange={(e) => handleChange("bank_account_last4", e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    placeholder="1234"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => handleChange("notes", e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            placeholder="Additional notes..."
                        />
                    </div>

                    {/* Summary */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 mb-6 border border-emerald-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-700">Gross Pay:</span>
                                <span className="text-lg font-semibold text-emerald-600">{formatCurrency(calculations.gross_pay)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-700">Total Deductions:</span>
                                <span className="text-lg font-semibold text-red-600">{formatCurrency(calculations.total_deductions)}</span>
                            </div>
                            <div className="h-px bg-gray-300"></div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-900 font-semibold">Net Pay:</span>
                                <span className="text-2xl font-bold text-gray-900">{formatCurrency(calculations.net_pay)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl"
                        >
                            {initialData ? "Update Payroll" : "Create Payroll"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
