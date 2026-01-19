"use client";

import { useState, useEffect } from "react";
import { X, Shield, Calendar, DollarSign, Users, FileText } from "lucide-react";
import { benefitsApi, BenefitPlan, BenefitPlanCreate } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

interface PlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    title: string;
    initialData?: BenefitPlan;
}

const BENEFIT_TYPES = [
    "Health Insurance",
    "Dental Insurance",
    "Vision Insurance",
    "Life Insurance",
    "Retirement Plan",
    "Paid Time Off",
    "Wellness Program",
    "Education Assistance",
    "Child Care",
    "Other"
];

const COVERAGE_LEVELS = ["Individual", "Employee + Spouse", "Employee + Children", "Family"];

export default function PlanModal({ isOpen, onClose, onSuccess, title, initialData }: PlanModalProps) {
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();
    const [formData, setFormData] = useState<BenefitPlanCreate>({
        plan_name: "",
        benefit_type: "Health Insurance",
        provider: "",
        description: "",
        coverage_level: "Individual",
        coverage_amount: "",
        monthly_premium: 0,
        employer_contribution: 0,
        employee_contribution: 0,
        deductible: 0,
        copay: 0,
        out_of_pocket_max: 0,
        eligibility_criteria: "Full-time employees",
        waiting_period_days: 0,
        plan_year_start: new Date().toISOString().split('T')[0],
        plan_year_end: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        enrollment_start: new Date().toISOString().split('T')[0],
        enrollment_end: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
        features: [],
        exclusions: [],
        max_enrollments: undefined,
        notes: "",
    });

    const [featureInput, setFeatureInput] = useState("");
    const [exclusionInput, setExclusionInput] = useState("");

    useEffect(() => {
        if (initialData) {
            setFormData({
                plan_name: initialData.plan_name,
                benefit_type: initialData.benefit_type,
                provider: initialData.provider || "",
                description: initialData.description,
                coverage_level: initialData.coverage_level,
                coverage_amount: initialData.coverage_amount || "",
                monthly_premium: initialData.monthly_premium,
                employer_contribution: initialData.employer_contribution,
                employee_contribution: initialData.employee_contribution,
                deductible: initialData.deductible || 0,
                copay: initialData.copay || 0,
                out_of_pocket_max: initialData.out_of_pocket_max || 0,
                eligibility_criteria: initialData.eligibility_criteria,
                waiting_period_days: initialData.waiting_period_days,
                plan_year_start: initialData.plan_year_start.split('T')[0],
                plan_year_end: initialData.plan_year_end.split('T')[0],
                enrollment_start: initialData.enrollment_start.split('T')[0],
                enrollment_end: initialData.enrollment_end.split('T')[0],
                features: initialData.features,
                exclusions: initialData.exclusions,
                max_enrollments: initialData.max_enrollments,
                notes: initialData.notes || "",
            });
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (initialData) {
                await benefitsApi.updatePlan(initialData.id, formData);
                showToast("success", "Benefit plan updated successfully");
            } else {
                await benefitsApi.createPlan(formData);
                showToast("success", "Benefit plan created successfully");
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Error saving plan:", error);
            showToast("error", error.response?.data?.detail || "Failed to save benefit plan");
        } finally {
            setLoading(false);
        }
    };

    const addFeature = () => {
        if (featureInput.trim()) {
            setFormData({ ...formData, features: [...(formData.features || []), featureInput.trim()] });
            setFeatureInput("");
        }
    };

    const removeFeature = (index: number) => {
        setFormData({ ...formData, features: formData.features?.filter((_, i) => i !== index) });
    };

    const addExclusion = () => {
        if (exclusionInput.trim()) {
            setFormData({ ...formData, exclusions: [...(formData.exclusions || []), exclusionInput.trim()] });
            setExclusionInput("");
        }
    };

    const removeExclusion = (index: number) => {
        setFormData({ ...formData, exclusions: formData.exclusions?.filter((_, i) => i !== index) });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Shield className="text-white" size={24} />
                        <h2 className="text-xl font-bold text-white">{title}</h2>
                    </div>
                    <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-lg transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Plan Information */}
                        <div className="md:col-span-2">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Information</h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Plan Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.plan_name}
                                onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Benefit Type *</label>
                            <select
                                required
                                value={formData.benefit_type}
                                onChange={(e) => setFormData({ ...formData, benefit_type: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            >
                                {BENEFIT_TYPES.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
                            <input
                                type="text"
                                value={formData.provider}
                                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            />
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

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                            <textarea
                                required
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            />
                        </div>

                        {/* Cost Information */}
                        <div className="md:col-span-2 mt-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Information</h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Premium *</label>
                            <input
                                type="number"
                                required
                                step="0.01"
                                value={formData.monthly_premium}
                                onChange={(e) => setFormData({ ...formData, monthly_premium: parseFloat(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Employer Contribution *</label>
                            <input
                                type="number"
                                required
                                step="0.01"
                                value={formData.employer_contribution}
                                onChange={(e) => setFormData({ ...formData, employer_contribution: parseFloat(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Employee Contribution *</label>
                            <input
                                type="number"
                                required
                                step="0.01"
                                value={formData.employee_contribution}
                                onChange={(e) => setFormData({ ...formData, employee_contribution: parseFloat(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Deductible</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.deductible}
                                onChange={(e) => setFormData({ ...formData, deductible: parseFloat(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            />
                        </div>

                        {/* Plan Dates */}
                        <div className="md:col-span-2 mt-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Dates</h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Plan Year Start *</label>
                            <input
                                type="date"
                                required
                                value={formData.plan_year_start}
                                onChange={(e) => setFormData({ ...formData, plan_year_start: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Plan Year End *</label>
                            <input
                                type="date"
                                required
                                value={formData.plan_year_end}
                                onChange={(e) => setFormData({ ...formData, plan_year_end: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Enrollment Start *</label>
                            <input
                                type="date"
                                required
                                value={formData.enrollment_start}
                                onChange={(e) => setFormData({ ...formData, enrollment_start: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Enrollment End *</label>
                            <input
                                type="date"
                                required
                                value={formData.enrollment_end}
                                onChange={(e) => setFormData({ ...formData, enrollment_end: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            />
                        </div>

                        {/* Additional Settings */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Eligibility Criteria *</label>
                            <input
                                type="text"
                                required
                                value={formData.eligibility_criteria}
                                onChange={(e) => setFormData({ ...formData, eligibility_criteria: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Waiting Period (Days)</label>
                            <input
                                type="number"
                                value={formData.waiting_period_days}
                                onChange={(e) => setFormData({ ...formData, waiting_period_days: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Max Enrollments</label>
                            <input
                                type="number"
                                value={formData.max_enrollments || ""}
                                onChange={(e) => setFormData({ ...formData, max_enrollments: e.target.value ? parseInt(e.target.value) : undefined })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                            <textarea
                                rows={2}
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                            />
                        </div>
                    </div>

                    {/* Actions */}
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
                            {loading ? "Saving..." : initialData ? "Update Plan" : "Create Plan"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
