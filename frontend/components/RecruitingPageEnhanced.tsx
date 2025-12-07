"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Search, X, Edit2, Trash2, Calendar as CalendarIcon, MapPin, Briefcase, Mail, Phone, User, Filter, ChevronDown, Clock, Video, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { candidateApi, Candidate, CandidateCreate, Interview } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { motion, AnimatePresence } from "framer-motion";
import { CandidateModal, CandidateDetailModal, ScheduleInterviewModal } from "./RecruitingModals";

const CANDIDATE_STATUSES = [
    "Applied", "Screening", "Phone Interview", "Technical Interview",
    "Final Interview", "Offer Extended", "Hired", "Rejected", "Withdrawn"
];

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    "Applied": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    "Screening": { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
    "Phone Interview": { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
    "Technical Interview": { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
    "Final Interview": { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
    "Offer Extended": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    "Hired": { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
    "Rejected": { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
    "Withdrawn": { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const RecruitingPage = () => {
    useAuth();
    const { showToast } = useToast();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    const [filterDate, setFilterDate] = useState("All");
    const [specificDate, setSpecificDate] = useState<string>("");
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [showDateDropdown, setShowDateDropdown] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [showScheduleModal, setShowScheduleModal] = useState<Candidate | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean; title: string; message: string;
        onConfirm: () => void; variant?: "danger" | "warning" | "info";
    }>({ isOpen: false, title: "", message: "", onConfirm: () => { } });

    useEffect(() => {
        fetchCandidates();
    }, []);

    const fetchCandidates = async () => {
        setLoading(true);
        try {
            const data = await candidateApi.getAll();
            setCandidates(data);
        } catch (error) {
            console.error("Failed to fetch candidates", error);
            showToast('error', 'Failed to load candidates');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (candidate: Candidate) => {
        setConfirmDialog({
            isOpen: true,
            title: "Delete Candidate",
            message: `Are you sure you want to delete ${candidate.first_name} ${candidate.last_name}?`,
            variant: "danger",
            onConfirm: async () => {
                try {
                    await candidateApi.delete(candidate.id);
                    fetchCandidates();
                    showToast('success', 'Candidate deleted');
                } catch (error) {
                    showToast('error', 'Failed to delete candidate');
                }
            },
        });
    };

    const handleStatusChange = async (candidate: Candidate, newStatus: string) => {
        try {
            await candidateApi.updateStatus(candidate.id, newStatus);
            fetchCandidates();
            showToast('success', 'Status updated');
        } catch (error) {
            showToast('error', 'Failed to update status');
        }
    };

    const filteredCandidates = useMemo(() => {
        return candidates.filter(candidate => {
            const statusMatch = filterStatus === "All" || candidate.status === filterStatus;
            const searchLower = searchQuery.toLowerCase().trim();
            const searchMatch = !searchQuery ||
                candidate.first_name.toLowerCase().includes(searchLower) ||
                candidate.last_name.toLowerCase().includes(searchLower) ||
                candidate.email.toLowerCase().includes(searchLower) ||
                candidate.position_applied.toLowerCase().includes(searchLower);

            // Date filtering
            let dateMatch = true;
            if (filterDate !== "All" && candidate.next_interview_date) {
                const interviewDate = new Date(candidate.next_interview_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (filterDate === "Today") {
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    dateMatch = interviewDate >= today && interviewDate < tomorrow;
                } else if (filterDate === "Tomorrow") {
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const dayAfter = new Date(tomorrow);
                    dayAfter.setDate(dayAfter.getDate() + 1);
                    dateMatch = interviewDate >= tomorrow && interviewDate < dayAfter;
                } else if (filterDate === "Specific" && specificDate) {
                    const specific = new Date(specificDate);
                    specific.setHours(0, 0, 0, 0);
                    const nextDay = new Date(specific);
                    nextDay.setDate(nextDay.getDate() + 1);
                    dateMatch = interviewDate >= specific && interviewDate < nextDay;
                }
            } else if (filterDate !== "All" && !candidate.next_interview_date) {
                dateMatch = false;
            }

            return statusMatch && searchMatch && dateMatch;
        });
    }, [candidates, filterStatus, searchQuery, filterDate, specificDate]);

    const stats = useMemo(() => {
        const byStatus: Record<string, number> = {};
        candidates.forEach(c => {
            byStatus[c.status] = (byStatus[c.status] || 0) + 1;
        });
        return {
            total: candidates.length,
            byStatus,
            active: candidates.filter(c => !["Hired", "Rejected", "Withdrawn"].includes(c.status)).length,
            upcomingInterviews: candidates.filter(c =>
                c.next_interview_date && new Date(c.next_interview_date) > new Date()
            ).length,
        };
    }, [candidates]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <header className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-lg">
                                <Briefcase size={28} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Recruiting</h1>
                                <p className="text-gray-500 mt-1">Manage candidates and hiring pipeline</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                        >
                            <Plus size={18} />
                            Add Candidate
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                            <p className="text-sm text-blue-600 font-medium">Total Candidates</p>
                            <p className="text-3xl font-bold text-blue-900 mt-1">{stats.total}</p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                            <p className="text-sm text-green-600 font-medium">Active Pipeline</p>
                            <p className="text-3xl font-bold text-green-900 mt-1">{stats.active}</p>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                            <p className="text-sm text-blue-600 font-medium">Upcoming Interviews</p>
                            <p className="text-3xl font-bold text-blue-900 mt-1">{stats.upcomingInterviews}</p>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                            <p className="text-sm text-blue-600 font-medium">Offers Extended</p>
                            <p className="text-3xl font-bold text-blue-900 mt-1">{stats.byStatus["Offer Extended"] || 0}</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                    <div className="flex flex-col lg:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, email, or position..."
                                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all text-sm"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        <div className="flex gap-3">
                            {/* Status Filter */}
                            <div className="relative lg:w-64">
                                {showStatusDropdown && <div className="fixed inset-0 z-10" onClick={() => setShowStatusDropdown(false)} />}
                                <button
                                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                    className={`relative w-full pl-9 pr-10 py-2.5 border-2 rounded-xl text-sm font-semibold focus:outline-none transition-all ${filterStatus === "All" ? "border-gray-200 bg-white text-gray-700" : "border-blue-200 bg-blue-50 text-blue-700"
                                        }`}
                                >
                                    <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2" />
                                    {filterStatus === "All" ? "All Statuses" : filterStatus}
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2" />
                                </button>
                                {showStatusDropdown && (
                                    <div className="absolute top-full mt-2 w-full bg-white border-2 border-gray-200 rounded-xl shadow-2xl z-[100] max-h-96 overflow-y-auto pb-2">
                                        <button
                                            onClick={() => { setFilterStatus("All"); setShowStatusDropdown(false); }}
                                            className={`w-full px-4 py-3 text-left text-sm font-medium ${filterStatus === "All" ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"}`}
                                        >
                                            All Statuses
                                        </button>
                                        {CANDIDATE_STATUSES.map(status => (
                                            <button
                                                key={status}
                                                onClick={() => { setFilterStatus(status); setShowStatusDropdown(false); }}
                                                className={`w-full px-4 py-3 text-left text-sm font-medium ${filterStatus === status ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"}`}
                                            >
                                                {status} {stats.byStatus[status] && <span className="text-xs text-gray-500">({stats.byStatus[status]})</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Date Filter */}
                            <div className="relative lg:w-64">
                                {showDateDropdown && <div className="fixed inset-0 z-10" onClick={() => setShowDateDropdown(false)} />}
                                <button
                                    onClick={() => setShowDateDropdown(!showDateDropdown)}
                                    className={`relative w-full pl-9 pr-10 py-2.5 border-2 rounded-xl text-sm font-semibold focus:outline-none transition-all ${filterDate === "All" ? "border-gray-200 bg-white text-gray-700" : "border-blue-200 bg-blue-50 text-blue-700"
                                        }`}
                                >
                                    <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2" />
                                    {filterDate === "All" ? "All Dates" : filterDate === "Specific" ? `${new Date(specificDate).toLocaleDateString()}` : filterDate}
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2" />
                                </button>
                                {showDateDropdown && (
                                    <div className="absolute top-full mt-2 w-full bg-white border-2 border-gray-200 rounded-xl shadow-2xl z-[100] pb-2">
                                        <button
                                            onClick={() => { setFilterDate("All"); setSpecificDate(""); setShowDateDropdown(false); }}
                                            className={`w-full px-4 py-3 text-left text-sm font-medium ${filterDate === "All" ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"}`}
                                        >
                                            All Dates
                                        </button>
                                        <button
                                            onClick={() => { setFilterDate("Today"); setSpecificDate(""); setShowDateDropdown(false); }}
                                            className={`w-full px-4 py-3 text-left text-sm font-medium ${filterDate === "Today" ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"}`}
                                        >
                                            Today
                                        </button>
                                        <button
                                            onClick={() => { setFilterDate("Tomorrow"); setSpecificDate(""); setShowDateDropdown(false); }}
                                            className={`w-full px-4 py-3 text-left text-sm font-medium ${filterDate === "Tomorrow" ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"}`}
                                        >
                                            Tomorrow
                                        </button>
                                        <div className="px-4 py-2 border-t border-gray-100 mt-1">
                                            <label className="block text-xs font-medium text-gray-600 mb-2">Specific Date</label>
                                            <input
                                                type="date"
                                                value={specificDate}
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        setSpecificDate(e.target.value);
                                                        setFilterDate("Specific");
                                                    }
                                                }}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-4" />
                        <p className="text-gray-500 font-medium">Loading candidates...</p>
                    </div>
                ) : filteredCandidates.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                            <User size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {candidates.length === 0 ? "No candidates yet" : "No matching candidates"}
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {candidates.length === 0 ? "Add your first candidate to get started" : "Try adjusting your filters"}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        <AnimatePresence>
                            {filteredCandidates.map((candidate, index) => (
                                <CandidateCard
                                    key={candidate.id}
                                    candidate={candidate}
                                    index={index}
                                    onEdit={() => setEditingCandidate(candidate)}
                                    onDelete={() => handleDelete(candidate)}
                                    onStatusChange={(status) => handleStatusChange(candidate, status)}
                                    onClick={() => setSelectedCandidate(candidate)}
                                    onScheduleInterview={() => setShowScheduleModal(candidate)}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>

            <CandidateModal
                isOpen={showCreateModal || !!editingCandidate}
                onClose={() => { setShowCreateModal(false); setEditingCandidate(null); }}
                onSuccess={() => { fetchCandidates(); setShowCreateModal(false); setEditingCandidate(null); showToast('success', 'Candidate saved'); }}
                candidate={editingCandidate || undefined}
            />

            {selectedCandidate && (
                <CandidateDetailModal
                    candidate={selectedCandidate}
                    onClose={() => setSelectedCandidate(null)}
                    onEdit={() => { setEditingCandidate(selectedCandidate); setSelectedCandidate(null); }}
                    onScheduleInterview={() => { setShowScheduleModal(selectedCandidate); setSelectedCandidate(null); }}
                />
            )}

            {showScheduleModal && (
                <ScheduleInterviewModal
                    candidate={showScheduleModal}
                    onClose={() => setShowScheduleModal(null)}
                    onSuccess={() => { fetchCandidates(); setShowScheduleModal(null); showToast('success', 'Interview scheduled'); }}
                />
            )}

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                variant={confirmDialog.variant}
            />
        </div>
    );
};

const CandidateCard = ({ candidate, index, onEdit, onDelete, onStatusChange, onClick, onScheduleInterview }: {
    candidate: Candidate;
    index: number;
    onEdit: () => void;
    onDelete: () => void;
    onStatusChange: (status: string) => void;
    onClick: () => void;
    onScheduleInterview: () => void;
}) => {
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const statusConfig = STATUS_COLORS[candidate.status] || STATUS_COLORS["Applied"];
    const nextInterview = candidate.next_interview_date ? new Date(candidate.next_interview_date) : null;
    const hasUpcomingInterview = nextInterview && nextInterview > new Date();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="group"
        >
            <div className="relative bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl hover:border-gray-300 transition-all">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                        <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {candidate.first_name[0]}{candidate.last_name[0]}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                            {candidate.first_name} {candidate.last_name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1.5">
                                <Briefcase size={14} className="text-gray-400" />
                                <span className="font-medium">{candidate.position_applied}</span>
                            </div>
                            {candidate.location && (
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={14} className="text-gray-400" />
                                    <span>{candidate.location}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5">
                                <Clock size={14} className="text-gray-400" />
                                <span>Applied {formatDate(candidate.applied_date)}</span>
                            </div>
                        </div>

                        {hasUpcomingInterview && (
                            <div className="mb-3 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-200">
                                <CalendarIcon size={14} />
                                <span>Next interview: {formatDate(candidate.next_interview_date!)}</span>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowStatusMenu(!showStatusMenu); }}
                                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border hover:opacity-80`}
                                >
                                    {candidate.status}
                                    <ChevronDown size={12} />
                                </button>
                                {showStatusMenu && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShowStatusMenu(false); }} />
                                        <div className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl z-20 min-w-48 max-h-64 overflow-y-auto pb-2">
                                            {CANDIDATE_STATUSES.map(status => (
                                                <button
                                                    key={status}
                                                    onClick={(e) => { e.stopPropagation(); onStatusChange(status); setShowStatusMenu(false); }}
                                                    className={`w-full px-4 py-2 text-left text-sm ${candidate.status === status ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-50"}`}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {candidate.skills.slice(0, 3).map((skill, i) => (
                                <span key={i} className="inline-flex items-center text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
                                    {skill}
                                </span>
                            ))}
                            {candidate.skills.length > 3 && (
                                <span className="text-xs text-gray-500">+{candidate.skills.length - 3} more</span>
                            )}
                        </div>
                    </div>

                    <div className="flex-shrink-0 flex items-center gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); onScheduleInterview(); }}
                            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            title="Schedule interview"
                        >
                            <CalendarIcon size={18} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(); }}
                            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            title="Edit"
                        >
                            <Edit2 size={18} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                            title="Delete"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
