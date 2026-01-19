"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, Filter, Plus, DollarSign, Calendar, User,
    Building2, CreditCard, TrendingUp, TrendingDown,
    CheckCircle, Clock, AlertCircle, Edit2, Trash2, Eye, FileText
} from "lucide-react";
import { payrollApi, PayrollRecord, PayrollCreate } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import PayrollModal from "@/components/Payroll/PayrollModal";
import PayrollDetailsModal from "@/components/Payroll/PayrollDetailsModal";

const STATUS_COLORS: Record<string, string> = {
    "Draft": "bg-gray-100 text-gray-700 border-gray-200",
    "Pending": "bg-yellow-100 text-yellow-700 border-yellow-200",
    "Approved": "bg-blue-100 text-blue-700 border-blue-200",
    "Processing": "bg-indigo-100 text-indigo-700 border-indigo-200",
    "Paid": "bg-emerald-100 text-emerald-700 border-emerald-200",
    "Failed": "bg-red-100 text-red-700 border-red-200",
};

const STATUS_ICONS: Record<string, any> = {
    "Draft": FileText,
    "Pending": Clock,
    "Approved": CheckCircle,
    "Processing": TrendingUp,
    "Paid": CheckCircle,
    "Failed": AlertCircle,
};

export default function PayrollPage() {
    const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
    const [filteredRecords, setFilteredRecords] = useState<PayrollRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
    const [recordToDelete, setRecordToDelete] = useState<PayrollRecord | null>(null);
    const { showToast } = useToast();

    // Fetch payroll records
    const fetchPayrollRecords = async () => {
        try {
            setLoading(true);
            const records = await payrollApi.getAll();
            setPayrollRecords(records);
            setFilteredRecords(records);
        } catch (error) {
            console.error("Error fetching payroll records:", error);
            showToast("error", "Failed to load payroll records");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayrollRecords();
    }, []);

    // Filter records
    useEffect(() => {
        let filtered = payrollRecords;

        // Filter by status
        if (statusFilter !== "All") {
            filtered = filtered.filter(record => record.status === statusFilter);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(record =>
                record.employee_name.toLowerCase().includes(query) ||
                record.employee_email.toLowerCase().includes(query) ||
                record.department?.toLowerCase().includes(query) ||
                record.position?.toLowerCase().includes(query)
            );
        }

        setFilteredRecords(filtered);
    }, [searchQuery, statusFilter, payrollRecords]);

    // Handle create payroll
    const handleCreatePayroll = async (data: PayrollCreate) => {
        try {
            await payrollApi.create(data);
            showToast("success", "Payroll record created successfully");
            setIsCreateModalOpen(false);
            fetchPayrollRecords();
        } catch (error) {
            console.error("Error creating payroll:", error);
            showToast("error", "Failed to create payroll record");
        }
    };

    // Handle edit payroll
    const handleEditPayroll = async (data: PayrollCreate) => {
        if (!selectedRecord) return;
        try {
            await payrollApi.update(selectedRecord.id, data);
            showToast("success", "Payroll record updated successfully");
            setIsEditModalOpen(false);
            setSelectedRecord(null);
            fetchPayrollRecords();
        } catch (error) {
            console.error("Error updating payroll:", error);
            showToast("error", "Failed to update payroll record");
        }
    };

    // Handle delete payroll
    const handleDeletePayroll = async () => {
        if (!recordToDelete) return;
        try {
            await payrollApi.delete(recordToDelete.id);
            showToast("success", "Payroll record deleted successfully");
            setRecordToDelete(null);
            fetchPayrollRecords();
        } catch (error: any) {
            console.error("Error deleting payroll:", error);
            showToast("error", error.response?.data?.detail || "Failed to delete payroll record");
        }
    };

    // Handle approve payroll
    const handleApprovePayroll = async (record: PayrollRecord) => {
        try {
            await payrollApi.approve(record.id);
            showToast("success", "Payroll record approved successfully");
            fetchPayrollRecords();
        } catch (error) {
            console.error("Error approving payroll:", error);
            showToast("error", "Failed to approve payroll record");
        }
    };

    // Calculate statistics
    const stats = {
        total: payrollRecords.length,
        draft: payrollRecords.filter(r => r.status === "Draft").length,
        approved: payrollRecords.filter(r => r.status === "Approved").length,
        paid: payrollRecords.filter(r => r.status === "Paid").length,
        totalPaid: payrollRecords
            .filter(r => r.status === "Paid")
            .reduce((sum, r) => sum + r.net_pay, 0),
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
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
            {/* Header */}
            <div className="bg-white px-8 py-8 shadow-lg border-b border-gray-100">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                                <DollarSign size={32} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-emerald-600">Payroll Management</h1>
                                <p className="text-gray-600 mt-1">Process payroll, manage compensation, and handle payments</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                        >
                            <Plus size={20} />
                            <span>New Payroll</span>
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-8">
                        <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Total Records</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                                </div>
                                <FileText className="text-emerald-500" size={24} />
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Draft</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.draft}</p>
                                </div>
                                <Clock className="text-emerald-500" size={24} />
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Approved</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.approved}</p>
                                </div>
                                <CheckCircle className="text-emerald-500" size={24} />
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Paid</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.paid}</p>
                                </div>
                                <CheckCircle className="text-emerald-500" size={24} />
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">Total Paid</p>
                                    <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(stats.totalPaid)}</p>
                                </div>
                                <TrendingUp className="text-emerald-500" size={24} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-8 py-8">
                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by employee name, email, department..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="pl-12 pr-8 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none bg-white cursor-pointer min-w-[200px]"
                            >
                                <option value="All">All Status</option>
                                <option value="Draft">Draft</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Processing">Processing</option>
                                <option value="Paid">Paid</option>
                                <option value="Failed">Failed</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Payroll Records Table */}
                {loading ? (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                        <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
                        <p className="text-gray-500 mt-4">Loading payroll records...</p>
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                        <DollarSign size={64} className="text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Payroll Records Found</h3>
                        <p className="text-gray-500 mb-6">
                            {searchQuery || statusFilter !== "All"
                                ? "Try adjusting your filters"
                                : "Get started by creating your first payroll record"}
                        </p>
                        {!searchQuery && statusFilter === "All" && (
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl"
                            >
                                <Plus size={20} />
                                <span>Create Payroll Record</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Employee</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Period</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Payment Date</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Gross Pay</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Deductions</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Net Pay</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    <AnimatePresence>
                                        {filteredRecords.map((record, index) => {
                                            const StatusIcon = STATUS_ICONS[record.status] || FileText;
                                            return (
                                                <motion.tr
                                                    key={record.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -20 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="hover:bg-emerald-50/50 transition-colors"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                                                                {record.employee_name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-gray-900">{record.employee_name}</p>
                                                                <p className="text-sm text-gray-500">{record.position || record.department || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm">
                                                            <p className="text-gray-900 font-medium">{formatDate(record.pay_period_start)}</p>
                                                            <p className="text-gray-500">to {formatDate(record.pay_period_end)}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 text-sm text-gray-900">
                                                            <Calendar size={16} className="text-gray-400" />
                                                            {formatDate(record.payment_date)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1 text-emerald-600 font-semibold">
                                                            <TrendingUp size={16} />
                                                            {formatCurrency(record.gross_pay)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1 text-red-600 font-semibold">
                                                            <TrendingDown size={16} />
                                                            {formatCurrency(record.total_deductions)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="text-gray-900 font-bold text-lg">
                                                            {formatCurrency(record.net_pay)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[record.status]}`}>
                                                            <StatusIcon size={14} />
                                                            {record.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedRecord(record);
                                                                    setIsDetailsModalOpen(true);
                                                                }}
                                                                className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                                title="View Details"
                                                            >
                                                                <Eye size={18} />
                                                            </button>
                                                            {record.status === "Draft" && (
                                                                <>
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedRecord(record);
                                                                            setIsEditModalOpen(true);
                                                                        }}
                                                                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                                        title="Edit"
                                                                    >
                                                                        <Edit2 size={18} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setRecordToDelete(record)}
                                                                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                </>
                                                            )}
                                                            {(record.status === "Draft" || record.status === "Pending") && (
                                                                <button
                                                                    onClick={() => handleApprovePayroll(record)}
                                                                    className="px-3 py-1.5 text-sm font-semibold text-emerald-600 hover:text-white bg-emerald-50 hover:bg-emerald-600 rounded-lg transition-all"
                                                                    title="Approve"
                                                                >
                                                                    Approve
                                                                </button>
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
                )}
            </div>

            {/* Modals */}
            <PayrollModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreatePayroll}
                title="Create Payroll Record"
            />

            <PayrollModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedRecord(null);
                }}
                onSubmit={handleEditPayroll}
                title="Edit Payroll Record"
                initialData={selectedRecord || undefined}
            />

            <PayrollDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => {
                    setIsDetailsModalOpen(false);
                    setSelectedRecord(null);
                }}
                record={selectedRecord}
            />

            <ConfirmDialog
                isOpen={!!recordToDelete}
                onClose={() => setRecordToDelete(null)}
                onConfirm={handleDeletePayroll}
                title="Delete Payroll Record"
                message={`Are you sure you want to delete the payroll record for ${recordToDelete?.employee_name}? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
}
