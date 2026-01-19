"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, Filter, Plus, Heart, Calendar, Users,
    Building2, Shield, TrendingUp, CheckCircle,
    Clock, AlertCircle, Edit2, Trash2, Eye, FileText, X
} from "lucide-react";
import { benefitsApi, BenefitPlan, BenefitEnrollment } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import PlanModal from "@/components/Benefits/PlanModal";
import EnrollmentModal from "@/components/Benefits/EnrollmentModal";
import PlanDetailsModal from "@/components/Benefits/PlanDetailsModal";
import EnrollmentDetailsModal from "@/components/Benefits/EnrollmentDetailsModal";

const BENEFIT_TYPES = [
    "All",
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

const ENROLLMENT_STATUSES = ["All", "Pending", "Active", "Declined", "Terminated", "Expired"];

const STATUS_COLORS: Record<string, string> = {
    "Pending": "bg-yellow-100 text-yellow-700 border-yellow-200",
    "Active": "bg-green-100 text-green-700 border-green-200",
    "Declined": "bg-red-100 text-red-700 border-red-200",
    "Terminated": "bg-gray-100 text-gray-700 border-gray-200",
    "Expired": "bg-orange-100 text-orange-700 border-orange-200",
};

const STATUS_ICONS: Record<string, any> = {
    "Pending": Clock,
    "Active": CheckCircle,
    "Declined": X,
    "Terminated": AlertCircle,
    "Expired": AlertCircle,
};

export default function BenefitsPage() {
    const [activeTab, setActiveTab] = useState<"plans" | "enrollments">("plans");
    const [plans, setPlans] = useState<BenefitPlan[]>([]);
    const [enrollments, setEnrollments] = useState<BenefitEnrollment[]>([]);
    const [filteredPlans, setFilteredPlans] = useState<BenefitPlan[]>([]);
    const [filteredEnrollments, setFilteredEnrollments] = useState<BenefitEnrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [benefitTypeFilter, setBenefitTypeFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [isCreatePlanModalOpen, setIsCreatePlanModalOpen] = useState(false);
    const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false);
    const [isCreateEnrollmentModalOpen, setIsCreateEnrollmentModalOpen] = useState(false);
    const [isPlanDetailsModalOpen, setIsPlanDetailsModalOpen] = useState(false);
    const [isEnrollmentDetailsModalOpen, setIsEnrollmentDetailsModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<BenefitPlan | null>(null);
    const [selectedEnrollment, setSelectedEnrollment] = useState<BenefitEnrollment | null>(null);
    const [planToDelete, setPlanToDelete] = useState<BenefitPlan | null>(null);
    const [enrollmentToDelete, setEnrollmentToDelete] = useState<BenefitEnrollment | null>(null);
    const { showToast } = useToast();

    // Fetch data
    const fetchPlans = async () => {
        try {
            const data = await benefitsApi.getAllPlans();
            setPlans(data);
            setFilteredPlans(data);
        } catch (error) {
            console.error("Error fetching benefit plans:", error);
            showToast("error", "Failed to load benefit plans");
        }
    };

    const fetchEnrollments = async () => {
        try {
            const data = await benefitsApi.getAllEnrollments();
            setEnrollments(data);
            setFilteredEnrollments(data);
        } catch (error) {
            console.error("Error fetching enrollments:", error);
            showToast("error", "Failed to load enrollments");
        }
    };

    const fetchData = async () => {
        setLoading(true);
        await Promise.all([fetchPlans(), fetchEnrollments()]);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filter plans
    useEffect(() => {
        let filtered = plans;

        if (benefitTypeFilter !== "All") {
            filtered = filtered.filter(plan => plan.benefit_type === benefitTypeFilter);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(plan =>
                plan.plan_name.toLowerCase().includes(query) ||
                plan.provider?.toLowerCase().includes(query) ||
                plan.description.toLowerCase().includes(query)
            );
        }

        setFilteredPlans(filtered);
    }, [searchQuery, benefitTypeFilter, plans]);

    // Filter enrollments
    useEffect(() => {
        let filtered = enrollments;

        if (statusFilter !== "All") {
            filtered = filtered.filter(enrollment => enrollment.status === statusFilter);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(enrollment =>
                enrollment.employee_name.toLowerCase().includes(query) ||
                enrollment.employee_email.toLowerCase().includes(query) ||
                enrollment.plan_name.toLowerCase().includes(query)
            );
        }

        setFilteredEnrollments(filtered);
    }, [searchQuery, statusFilter, enrollments]);

    // Handle plan operations
    const handleDeletePlan = async () => {
        if (!planToDelete) return;
        try {
            await benefitsApi.deletePlan(planToDelete.id);
            showToast("success", "Benefit plan deleted successfully");
            setPlanToDelete(null);
            fetchPlans();
        } catch (error: any) {
            console.error("Error deleting plan:", error);
            showToast("error", error.response?.data?.detail || "Failed to delete benefit plan");
        }
    };

    // Handle enrollment operations
    const handleApproveEnrollment = async (enrollment: BenefitEnrollment) => {
        try {
            await benefitsApi.approveEnrollment(enrollment.id);
            showToast("success", "Enrollment approved successfully");
            fetchEnrollments();
        } catch (error) {
            console.error("Error approving enrollment:", error);
            showToast("error", "Failed to approve enrollment");
        }
    };

    const handleDeleteEnrollment = async () => {
        if (!enrollmentToDelete) return;
        try {
            await benefitsApi.deleteEnrollment(enrollmentToDelete.id);
            showToast("success", "Enrollment deleted successfully");
            setEnrollmentToDelete(null);
            fetchEnrollments();
        } catch (error: any) {
            console.error("Error deleting enrollment:", error);
            showToast("error", error.response?.data?.detail || "Failed to delete enrollment");
        }
    };

    // Calculate statistics
    const stats = {
        totalPlans: plans.length,
        activePlans: plans.filter(p => p.is_active).length,
        totalEnrollments: enrollments.length,
        activeEnrollments: enrollments.filter(e => e.status === "Active").length,
        pendingEnrollments: enrollments.filter(e => e.status === "Pending").length,
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
            {/* Header */}
            <div className="bg-white px-8 py-8 shadow-lg border-b border-gray-100">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                                <Heart size={32} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-rose-600">Benefits Management</h1>
                                <p className="text-gray-600 mt-1">Manage employee benefits, plans, and enrollments</p>
                            </div>
                        </div>
                        <button
                            onClick={() => activeTab === "plans" ? setIsCreatePlanModalOpen(true) : setIsCreateEnrollmentModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl font-semibold hover:from-rose-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                        >
                            <Plus size={20} />
                            <span>{activeTab === "plans" ? "New Plan" : "New Enrollment"}</span>
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-8">
                        <div className="bg-white rounded-xl p-4 border border-rose-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Total Plans</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalPlans}</p>
                                </div>
                                <Shield className="text-rose-500" size={24} />
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-rose-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Active Plans</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activePlans}</p>
                                </div>
                                <CheckCircle className="text-rose-500" size={24} />
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-rose-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Total Enrollments</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalEnrollments}</p>
                                </div>
                                <Users className="text-rose-500" size={24} />
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-rose-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Active</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activeEnrollments}</p>
                                </div>
                                <TrendingUp className="text-rose-500" size={24} />
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-rose-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Pending</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingEnrollments}</p>
                                </div>
                                <Clock className="text-rose-500" size={24} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-8 py-8">
                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2 mb-6">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab("plans")}
                            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === "plans"
                                    ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md"
                                    : "text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Shield size={20} />
                                <span>Benefit Plans</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab("enrollments")}
                            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === "enrollments"
                                    ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md"
                                    : "text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Users size={20} />
                                <span>Enrollments</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder={activeTab === "plans" ? "Search plans..." : "Search enrollments..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                            />
                        </div>

                        {/* Filter */}
                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <select
                                value={activeTab === "plans" ? benefitTypeFilter : statusFilter}
                                onChange={(e) => activeTab === "plans" ? setBenefitTypeFilter(e.target.value) : setStatusFilter(e.target.value)}
                                className="pl-12 pr-8 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all appearance-none bg-white cursor-pointer min-w-[200px]"
                            >
                                {activeTab === "plans" ? (
                                    BENEFIT_TYPES.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))
                                ) : (
                                    ENROLLMENT_STATUSES.map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                        <div className="animate-spin w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full mx-auto"></div>
                        <p className="text-gray-500 mt-4">Loading...</p>
                    </div>
                ) : activeTab === "plans" ? (
                    filteredPlans.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                            <Shield size={64} className="text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Benefit Plans Found</h3>
                            <p className="text-gray-500 mb-6">
                                {searchQuery || benefitTypeFilter !== "All"
                                    ? "Try adjusting your filters"
                                    : "Get started by creating your first benefit plan"}
                            </p>
                            {!searchQuery && benefitTypeFilter === "All" && (
                                <button
                                    onClick={() => setIsCreatePlanModalOpen(true)}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-all shadow-lg hover:shadow-xl"
                                >
                                    <Plus size={20} />
                                    <span>Create Benefit Plan</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence>
                                {filteredPlans.map((plan, index) => (
                                    <motion.div
                                        key={plan.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.plan_name}</h3>
                                                <p className="text-sm text-rose-600 font-medium">{plan.benefit_type}</p>
                                                {plan.provider && (
                                                    <p className="text-xs text-gray-500 mt-1">Provider: {plan.provider}</p>
                                                )}
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${plan.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                                                }`}>
                                                {plan.is_active ? "Active" : "Inactive"}
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{plan.description}</p>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">Coverage:</span>
                                                <span className="font-semibold text-gray-900">{plan.coverage_level}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">Premium:</span>
                                                <span className="font-semibold text-rose-600">{formatCurrency(plan.monthly_premium)}/mo</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">Enrollments:</span>
                                                <span className="font-semibold text-gray-900">
                                                    {plan.current_enrollments}
                                                    {plan.max_enrollments && ` / ${plan.max_enrollments}`}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                                            <button
                                                onClick={() => {
                                                    setSelectedPlan(plan);
                                                    setIsPlanDetailsModalOpen(true);
                                                }}
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-gray-700 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all text-sm font-medium"
                                            >
                                                <Eye size={16} />
                                                <span>View</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedPlan(plan);
                                                    setIsEditPlanModalOpen(true);
                                                }}
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all text-sm font-medium"
                                            >
                                                <Edit2 size={16} />
                                                <span>Edit</span>
                                            </button>
                                            <button
                                                onClick={() => setPlanToDelete(plan)}
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all text-sm font-medium"
                                            >
                                                <Trash2 size={16} />
                                                <span>Delete</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )
                ) : (
                    // Enrollments Table (similar to Payroll)
                    filteredEnrollments.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                            <Users size={64} className="text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Enrollments Found</h3>
                            <p className="text-gray-500 mb-6">
                                {searchQuery || statusFilter !== "All"
                                    ? "Try adjusting your filters"
                                    : "Get started by enrolling employees in benefit plans"}
                            </p>
                            {!searchQuery && statusFilter === "All" && (
                                <button
                                    onClick={() => setIsCreateEnrollmentModalOpen(true)}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-all shadow-lg hover:shadow-xl"
                                >
                                    <Plus size={20} />
                                    <span>Enroll Employee</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gradient-to-r from-rose-50 to-pink-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Employee</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Plan</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Effective Date</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Premium</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        <AnimatePresence>
                                            {filteredEnrollments.map((enrollment, index) => {
                                                const StatusIcon = STATUS_ICONS[enrollment.status] || FileText;
                                                return (
                                                    <motion.tr
                                                        key={enrollment.id}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -20 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className="hover:bg-rose-50/50 transition-colors"
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                                                                    {enrollment.employee_name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-gray-900">{enrollment.employee_name}</p>
                                                                    <p className="text-sm text-gray-500">{enrollment.department || 'N/A'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div>
                                                                <p className="font-semibold text-gray-900">{enrollment.plan_name}</p>
                                                                <p className="text-sm text-rose-600">{enrollment.benefit_type}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2 text-sm text-gray-900">
                                                                <Calendar size={16} className="text-gray-400" />
                                                                {formatDate(enrollment.effective_date)}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="text-rose-600 font-semibold">
                                                                {formatCurrency(enrollment.monthly_premium)}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                Employee: {formatCurrency(enrollment.employee_contribution)}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[enrollment.status]}`}>
                                                                <StatusIcon size={14} />
                                                                {enrollment.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedEnrollment(enrollment);
                                                                        setIsEnrollmentDetailsModalOpen(true);
                                                                    }}
                                                                    className="p-2 text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                                    title="View Details"
                                                                >
                                                                    <Eye size={18} />
                                                                </button>
                                                                {enrollment.status === "Pending" && (
                                                                    <>
                                                                        <button
                                                                            onClick={() => handleApproveEnrollment(enrollment)}
                                                                            className="px-3 py-1.5 text-sm font-semibold text-green-600 hover:text-white bg-green-50 hover:bg-green-600 rounded-lg transition-all"
                                                                            title="Approve"
                                                                        >
                                                                            Approve
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setEnrollmentToDelete(enrollment)}
                                                                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                                            title="Delete"
                                                                        >
                                                                            <Trash2 size={18} />
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                )}
            </div>

            {/* Modals */}
            <PlanModal
                isOpen={isCreatePlanModalOpen}
                onClose={() => setIsCreatePlanModalOpen(false)}
                onSuccess={fetchPlans}
                title="Create Benefit Plan"
            />

            <PlanModal
                isOpen={isEditPlanModalOpen}
                onClose={() => {
                    setIsEditPlanModalOpen(false);
                    setSelectedPlan(null);
                }}
                onSuccess={fetchPlans}
                title="Edit Benefit Plan"
                initialData={selectedPlan || undefined}
            />

            <EnrollmentModal
                isOpen={isCreateEnrollmentModalOpen}
                onClose={() => setIsCreateEnrollmentModalOpen(false)}
                onSuccess={fetchEnrollments}
                plans={plans.filter(p => p.is_active)}
            />

            <PlanDetailsModal
                isOpen={isPlanDetailsModalOpen}
                onClose={() => {
                    setIsPlanDetailsModalOpen(false);
                    setSelectedPlan(null);
                }}
                plan={selectedPlan}
            />

            <EnrollmentDetailsModal
                isOpen={isEnrollmentDetailsModalOpen}
                onClose={() => {
                    setIsEnrollmentDetailsModalOpen(false);
                    setSelectedEnrollment(null);
                }}
                enrollment={selectedEnrollment}
            />

            <ConfirmDialog
                isOpen={!!planToDelete}
                onClose={() => setPlanToDelete(null)}
                onConfirm={handleDeletePlan}
                title="Delete Benefit Plan"
                message={`Are you sure you want to delete "${planToDelete?.plan_name}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
            />

            <ConfirmDialog
                isOpen={!!enrollmentToDelete}
                onClose={() => setEnrollmentToDelete(null)}
                onConfirm={handleDeleteEnrollment}
                title="Delete Enrollment"
                message={`Are you sure you want to delete the enrollment for ${enrollmentToDelete?.employee_name}? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
}
