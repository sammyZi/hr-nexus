"use client";

import { useState } from "react";
import { X, Users, Calendar, Shield } from "lucide-react";
import { benefitsApi, BenefitPlan, BenefitEnrollmentCreate } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

interface EnrollmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    plans: BenefitPlan[];
}

const COVERAGE_LEVELS = ["Individual", "Employee + Spouse", "Employee + Children", "Family"];

export default function EnrollmentModal({ isOpen, onClose, onSuccess, plans }: EnrollmentModalProps) {
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();
    const [formData, setFormData] = useState<BenefitEnrollmentCreate>({
        employee_id: "",
        employee_name: "",
        employee_email: "",
        department: "",
        position: "",
        plan_id: "",
        enrollment_date: new Date().toISOString().split('T')[0],
        effective_date: new Date().toISOString().split('T')[0],
        coverage_level: "Individual",
        dependents: [],
        payment_frequency: "Monthly",
        deduction_start_date: new Date().toISOString().split('T')[0],
        notes: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await benefitsApi.createEnrollment(formData);
            showToast("success", "Employee enrolled successfully");
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Error creating enrollment:", error);
            showToast("error", error.response?.data?.detail || "Failed to enroll employee");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Users className="text-white" size={24} />
                        <h2 className="text-xl font-bold text-white">Enroll Employee</h2>
                    </div>
                    <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition-all">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Information</h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID *</label>
                            <input
                                type="text"
                                required
                                value={formData.employee_id}
                                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Employee Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.employee_name}
                                onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                            <input
                                type="email"
                                required
                                value={formData.employee_email}
                                onChange={(e) => setFormData({ ...formData, employee_email: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                            <input
                                type="text"
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            />
                        </div>

                        <div className="md:col-span-2 mt-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Details</h3>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Benefit Plan *</label>
                            <select
                                required
                                value={formData.plan_id}
                                onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            >
                                <option value="">Select a plan...</option>
                                {plans.map(plan => (
                                    <option key={plan.id} value={plan.id}>
                                        {plan.plan_name} - {plan.benefit_type} (${plan.monthly_premium}/mo)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Coverage Level *</label>
                            <select
                                required
                                value={formData.coverage_level}
                                onChange={(e) => setFormData({ ...formData, coverage_level: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            >
                                {COVERAGE_LEVELS.map(level => (
                                    <option key={level} value={level}>{level}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Frequency *</label>
                            <select
                                required
                                value={formData.payment_frequency}
                                onChange={(e) => setFormData({ ...formData, payment_frequency: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            >
                                <option value="Monthly">Monthly</option>
                                <option value="Bi-weekly">Bi-weekly</option>
                                <option value="Semi-monthly">Semi-monthly</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Enrollment Date *</label>
                            <input
                                type="date"
                                required
                                value={formData.enrollment_date}
                                onChange={(e) => setFormData({ ...formData, enrollment_date: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Effective Date *</label>
                            <input
                                type="date"
                                required
                                value={formData.effective_date}
                                onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                            <textarea
                                rows={3}
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-lg font-semibold hover:from-rose-700 hover:to-pink-700 transition-all disabled:opacity-50"
                        >
                            {loading ? "Enrolling..." : "Enroll Employee"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
