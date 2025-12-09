"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, Filter, Plus, FileText, AlertTriangle,
    MoreVertical, User, Calendar, MessageSquare, Shield,
    CheckCircle, XCircle, Clock
} from "lucide-react";
import { EmployeeCase, caseApi, CaseCreate, CaseUpdate } from "@/lib/api";
import { CaseModal } from "./CaseModal";
import { StatsCards } from "./StatsCards";
import { Dropdown } from "@/components/ui/Dropdown";
import { CaseActionsMenu } from "./CaseActionsMenu";

const TABS = ["All Cases", "Policies", "Reports"];
const STATUS_COLORS: Record<string, string> = {
    "Open": "bg-blue-100 text-blue-700 border-blue-200",
    "Investigating": "bg-orange-100 text-orange-700 border-orange-200",
    "Action Required": "bg-rose-100 text-rose-700 border-rose-200",
    "Resolved": "bg-green-100 text-green-700 border-green-200",
    "Closed": "bg-gray-100 text-gray-700 border-gray-200",
};

export default function EmployeeRelationsPage() {
    const [activeTab, setActiveTab] = useState("All Cases");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedCase, setSelectedCase] = useState<EmployeeCase | undefined>(undefined);
    const [cases, setCases] = useState<EmployeeCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("All");

    useEffect(() => {
        fetchCases();
    }, [selectedStatus]);

    const fetchCases = async () => {
        setLoading(true);
        try {
            const data = await caseApi.getAll(selectedStatus !== "All" ? selectedStatus : undefined);
            setCases(data);
        } catch (error) {
            console.error("Failed to fetch cases", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCase = async (data: CaseCreate) => {
        try {
            await caseApi.create(data);
            await fetchCases();
        } catch (error) {
            console.error(error);
            alert("Failed to create case");
        }
    };

    const handleEditCase = async (data: CaseCreate) => {
        if (!selectedCase) return;
        try {
            const updateData: CaseUpdate = {
                title: data.title,
                description: data.description,
                case_type: data.case_type as any,
                priority: data.priority,
            };
            await caseApi.update(selectedCase.id, updateData);
            await fetchCases();
            setIsEditModalOpen(false);
            setSelectedCase(undefined);
        } catch (error) {
            console.error(error);
            alert("Failed to update case");
        }
    };

    const handleMarkComplete = async (caseId: string) => {
        try {
            await caseApi.update(caseId, { status: "Resolved" as any });
            await fetchCases();
        } catch (error) {
            console.error(error);
            alert("Failed to mark case as complete");
        }
    };

    const handleViewCase = (caseItem: EmployeeCase) => {
        setSelectedCase(caseItem);
        setIsEditModalOpen(true);
    };

    const handleEditCaseClick = (caseItem: EmployeeCase) => {
        setSelectedCase(caseItem);
        setIsEditModalOpen(true);
    };

    const filteredCases = cases.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.employee_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calculate stats
    const openCases = cases.filter(c => c.status !== "Resolved" && c.status !== "Closed").length;
    const resolvedThisMonth = cases.filter(c => c.status === "Resolved").length; // Simplified for demo
    const avgDays = 5; // Placeholder

    return (
        <div className="min-h-screen bg-gray-50/50 p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Employee Relations</h1>
                        <p className="text-gray-500 mt-2 text-lg">Manage grievances, disciplinary actions, and workplace investigations.</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="group flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/30 transform hover:-translate-y-0.5"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        Report New Case
                    </button>
                </div>

                {/* Statistics Cards */}
                <StatsCards
                    totalCases={cases.length}
                    openCases={openCases}
                    resolvedThisMonth={resolvedThisMonth}
                    avgResolutionDays={avgDays}
                />

                {/* Main Content Area */}
                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-visible">
                    {/* Toolbar */}
                    <div className="p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                            {/* Tabs */}
                            <div className="flex p-1 bg-gray-100 rounded-xl w-fit">
                                {TABS.map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === tab
                                            ? "bg-white text-gray-900 shadow-sm"
                                            : "text-gray-500 hover:text-gray-700"
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* Filters */}
                            <div className="flex items-center gap-3 bg-white">
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search cases..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent hover:bg-white hover:border-gray-200 focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50 rounded-xl text-sm font-medium transition-all w-64 outline-none"
                                    />
                                </div>
                                <div className="h-8 w-[1px] bg-gray-200 mx-1" />
                                <Dropdown
                                    options={[
                                        { value: 'All', label: 'All Status' },
                                        { value: 'Open', label: 'Open' },
                                        { value: 'Investigating', label: 'Investigating' },
                                        { value: 'Action Required', label: 'Action Required' },
                                        { value: 'Resolved', label: 'Resolved' },
                                        { value: 'Closed', label: 'Closed' }
                                    ]}
                                    value={selectedStatus}
                                    onChange={setSelectedStatus}
                                    color="indigo"
                                    className="w-48"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Case List */}
                    <div className="p-2 overflow-visible">
                        {loading ? (
                            <div className="py-20 text-center text-gray-500">Loading cases...</div>
                        ) : activeTab === "All Cases" ? (
                            <div className="grid gap-2">
                                {filteredCases.map((caseItem) => (
                                    <motion.div
                                        key={caseItem.id}
                                        layoutId={caseItem.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        onClick={() => handleViewCase(caseItem)}
                                        className="group relative bg-white hover:bg-gray-50 p-5 rounded-2xl border border-transparent hover:border-gray-200 transition-all cursor-pointer flex flex-col md:flex-row gap-6 items-start md:items-center"
                                    >
                                        {/* Status Indicator Bar */}
                                        <div className={`absolute left-0 top-6 bottom-6 w-1 rounded-r-full ${caseItem.priority === "Critical" ? "bg-indigo-500" :
                                            caseItem.priority === "High" ? "bg-orange-500" :
                                                "bg-blue-500"
                                            }`} />

                                        <div className="flex-1 pl-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                    {caseItem.title}
                                                </h3>
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_COLORS[caseItem.status] || "bg-gray-100 text-gray-600"}`}>
                                                    {caseItem.status}
                                                </span>
                                                {caseItem.is_confidential && (
                                                    <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                                        <Shield className="w-3 h-3" /> Confidential
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-gray-500 text-sm line-clamp-1 mb-3">{caseItem.description}</p>

                                            <div className="flex items-center gap-6 text-sm text-gray-400">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4" />
                                                    <span className="font-medium text-gray-600">{caseItem.employee_name}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{new Date(caseItem.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangle className="w-4 h-4" />
                                                    <span className={caseItem.priority === "Critical" ? "text-indigo-600 font-bold" : ""}>
                                                        {caseItem.priority} Priority
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div
                                            className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <CaseActionsMenu
                                                caseId={caseItem.id}
                                                onView={() => handleViewCase(caseItem)}
                                                onEdit={() => handleEditCaseClick(caseItem)}
                                                onMarkComplete={() => handleMarkComplete(caseItem.id)}
                                            />
                                        </div>
                                    </motion.div>
                                ))}
                                {filteredCases.length === 0 && (
                                    <div className="py-20 text-center">
                                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <FileText className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900">No cases found</h3>
                                        <p className="text-gray-500">Try adjusting your search or filters.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="py-20 text-center text-gray-400">
                                <p>Feature coming soon...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <CaseModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateCase}
            />

            <CaseModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedCase(undefined);
                }}
                onSubmit={handleEditCase}
                caseToEdit={selectedCase}
            />
        </div>
    );
}
