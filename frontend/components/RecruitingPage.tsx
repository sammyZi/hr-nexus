"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Search, X, Edit2, Trash2, Star, MapPin, Briefcase, Mail, Phone, Calendar, User, Filter, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { candidateApi, Candidate, CandidateCreate } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { motion, AnimatePresence } from "framer-motion";

const CANDIDATE_STATUSES = [
    "Applied",
    "Screening",
    "Phone Interview",
    "Technical Interview",
    "Final Interview",
    "Offer Extended",
    "Hired",
    "Rejected",
    "Withdrawn"
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

export const RecruitingPage = () => {
    useAuth();
    const { showToast } = useToast();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("All");
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant?: "danger" | "warning" | "info";
    }>({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
    });

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
            message: `Are you sure you want to delete ${candidate.first_name} ${candidate.last_name}? This action cannot be undone.`,
            variant: "danger",
            onConfirm: async () => {
                try {
                    await candidateApi.delete(candidate.id);
                    fetchCandidates();
                    showToast('success', 'Candidate deleted');
                } catch (error) {
                    console.error("Failed to delete candidate", error);
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
            console.error("Failed to update status", error);
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
            return statusMatch && searchMatch;
        });
    }, [candidates, filterStatus, searchQuery]);

    const stats = useMemo(() => {
        const byStatus: Record<string, number> = {};
        candidates.forEach(c => {
            byStatus[c.status] = (byStatus[c.status] || 0) + 1;
        });
        return {
            total: candidates.length,
            byStatus,
            active: candidates.filter(c => !["Hired", "Rejected", "Withdrawn"].includes(c.status)).length,
        };
    }, [candidates]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <header className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                                <Briefcase size={28} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Recruiting</h1>
                                <p className="text-gray-500 mt-1">Manage candidates and hiring pipeline</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30"
                        >
                            <Plus size={18} />
                            Add Candidate
                        </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                            <p className="text-sm text-blue-600 font-medium">Total Candidates</p>
                            <p className="text-3xl font-bold text-blue-900 mt-1">{stats.total}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                            <p className="text-sm text-green-600 font-medium">Active Pipeline</p>
                            <p className="text-3xl font-bold text-green-900 mt-1">{stats.active}</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                            <p className="text-sm text-purple-600 font-medium">In Interviews</p>
                            <p className="text-3xl font-bold text-purple-900 mt-1">
                                {(stats.byStatus["Phone Interview"] || 0) + (stats.byStatus["Technical Interview"] || 0) + (stats.byStatus["Final Interview"] || 0)}
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                            <p className="text-sm text-amber-600 font-medium">Offers Extended</p>
                            <p className="text-3xl font-bold text-amber-900 mt-1">{stats.byStatus["Offer Extended"] || 0}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
                {/* Search & Filter */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                    <div className="flex flex-col lg:flex-row gap-3">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, email, or position..."
                                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all text-sm text-gray-900 placeholder-gray-400 bg-gray-50 hover:bg-white"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* Status Filter */}
                        <div className="relative lg:w-64">
                            {showStatusDropdown && (
                                <div className="fixed inset-0 z-10" onClick={() => setShowStatusDropdown(false)} />
                            )}
                            <button
                                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                className={`relative w-full pl-9 pr-10 py-2.5 border-2 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 transition-all text-left ${filterStatus === "All"
                                    ? "border-gray-200 bg-white text-gray-700 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-300"
                                    : "border-blue-200 bg-blue-50 text-blue-700 focus:ring-blue-500/20 focus:border-blue-500"
                                    }`}
                            >
                                <Filter size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${filterStatus === "All" ? "text-gray-400" : "text-blue-500"}`} />
                                {filterStatus === "All" ? "All Statuses" : filterStatus}
                                <ChevronDown size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
                            </button>
                            {showStatusDropdown && (
                                <div className="absolute top-full mt-2 w-full bg-white border-2 border-gray-200 rounded-xl shadow-2xl z-[100] overflow-hidden max-h-96 overflow-y-auto">
                                    <button
                                        onClick={() => {
                                            setFilterStatus("All");
                                            setShowStatusDropdown(false);
                                        }}
                                        className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors ${filterStatus === "All" ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}
                                    >
                                        All Statuses
                                    </button>
                                    {CANDIDATE_STATUSES.map(status => (
                                        <button
                                            key={status}
                                            onClick={() => {
                                                setFilterStatus(status);
                                                setShowStatusDropdown(false);
                                            }}
                                            className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors ${filterStatus === status ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}
                                        >
                                            {status}
                                            {stats.byStatus[status] && (
                                                <span className="ml-2 text-xs text-gray-500">({stats.byStatus[status]})</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Candidates List */}
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
                        {candidates.length === 0 && (
                            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                                <Plus size={18} />
                                Add First Candidate
                            </Button>
                        )}
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
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>

            {/* Create/Edit Modal */}
            <CandidateModal
                isOpen={showCreateModal || !!editingCandidate}
                onClose={() => {
                    setShowCreateModal(false);
                    setEditingCandidate(null);
                }}
                onSuccess={() => {
                    fetchCandidates();
                    setShowCreateModal(false);
                    setEditingCandidate(null);
                    showToast('success', 'Candidate saved successfully');
                }}
                candidate={editingCandidate || undefined}
            />

            {/* Candidate Detail Modal */}
            {selectedCandidate && (
                <CandidateDetailModal
                    candidate={selectedCandidate}
                    onClose={() => setSelectedCandidate(null)}
                    onEdit={() => {
                        setEditingCandidate(selectedCandidate);
                        setSelectedCandidate(null);
                    }}
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

// Candidate Card Component
const CandidateCard = ({ candidate, index, onEdit, onDelete, onStatusChange, onClick }: {
    candidate: Candidate;
    index: number;
    onEdit: () => void;
    onDelete: () => void;
    onStatusChange: (status: string) => void;
    onClick: () => void;
}) => {
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const statusConfig = STATUS_COLORS[candidate.status] || STATUS_COLORS["Applied"];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="group"
        >
            <div className="relative bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl hover:border-gray-300 transition-all duration-300">
                <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {candidate.first_name[0]}{candidate.last_name[0]}
                        </div>
                    </div>

                    {/* Main Content */}
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
                            {candidate.years_of_experience !== undefined && (
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={14} className="text-gray-400" />
                                    <span>{candidate.years_of_experience} years exp</span>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Status Badge */}
                            <div className="relative">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowStatusMenu(!showStatusMenu);
                                    }}
                                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border hover:opacity-80 transition-opacity`}
                                >
                                    {candidate.status}
                                    <ChevronDown size={12} />
                                </button>
                                {showStatusMenu && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShowStatusMenu(false); }} />
                                        <div className="absolute top-full left-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl z-20 min-w-48 max-h-64 overflow-y-auto">
                                            {CANDIDATE_STATUSES.map(status => (
                                                <button
                                                    key={status}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onStatusChange(status);
                                                        setShowStatusMenu(false);
                                                    }}
                                                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${candidate.status === status ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Skills */}
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

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(); }}
                            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            title="Edit candidate"
                        >
                            <Edit2 size={18} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                            title="Delete candidate"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Candidate Modal Component (simplified - full implementation would be larger)
const CandidateModal = ({ isOpen, onClose, onSuccess, candidate }: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    candidate?: Candidate;
}) => {
    const { showToast } = useToast();
    const [formData, setFormData] = useState<CandidateCreate>({
        first_name: candidate?.first_name || "",
        last_name: candidate?.last_name || "",
        email: candidate?.email || "",
        phone: candidate?.phone || "",
        location: candidate?.location || "",
        linkedin_url: candidate?.linkedin_url || "",
        portfolio_url: candidate?.portfolio_url || "",
        position_applied: candidate?.position_applied || "",
        department: candidate?.department || "",
        source: candidate?.source || "",
        expected_salary: candidate?.expected_salary || "",
        notice_period: candidate?.notice_period || "",
        years_of_experience: candidate?.years_of_experience || undefined,
        skills: candidate?.skills || [],
        education: candidate?.education || "",
        notes: candidate?.notes || "",
    });
    const [skillInput, setSkillInput] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (candidate) {
                await candidateApi.update(candidate.id, formData);
            } else {
                await candidateApi.create(formData);
            }
            onSuccess();
        } catch (error) {
            console.error("Failed to save candidate", error);
            showToast('error', 'Failed to save candidate');
        } finally {
            setSubmitting(false);
        }
    };

    const addSkill = () => {
        if (skillInput.trim() && !formData.skills?.includes(skillInput.trim())) {
            setFormData({ ...formData, skills: [...(formData.skills || []), skillInput.trim()] });
            setSkillInput("");
        }
    };

    const removeSkill = (skill: string) => {
        setFormData({ ...formData, skills: formData.skills?.filter(s => s !== skill) || [] });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {candidate ? "Edit Candidate" : "Add New Candidate"}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Personal Information */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                                <input
                                    type="url"
                                    value={formData.linkedin_url}
                                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Job Details */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Application</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Position Applied *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.position_applied}
                                    onChange={(e) => setFormData({ ...formData, position_applied: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                <input
                                    type="text"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                                <input
                                    type="text"
                                    placeholder="e.g., LinkedIn, Referral, Job Board"
                                    value={formData.source}
                                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.years_of_experience || ""}
                                    onChange={(e) => setFormData({ ...formData, years_of_experience: e.target.value ? parseInt(e.target.value) : undefined })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Salary</label>
                                <input
                                    type="text"
                                    value={formData.expected_salary}
                                    onChange={(e) => setFormData({ ...formData, expected_salary: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notice Period</label>
                                <input
                                    type="text"
                                    value={formData.notice_period}
                                    onChange={(e) => setFormData({ ...formData, notice_period: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Skills */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                placeholder="Add a skill..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <Button type="button" onClick={addSkill} variant="secondary">Add</Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.skills?.map((skill, i) => (
                                <span key={i} className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                                    {skill}
                                    <button type="button" onClick={() => removeSkill(skill)} className="hover:text-blue-900">
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Education & Notes */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                            <input
                                type="text"
                                value={formData.education}
                                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <textarea
                                rows={3}
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                        <Button type="button" onClick={onClose} variant="secondary">Cancel</Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? "Saving..." : candidate ? "Update Candidate" : "Add Candidate"}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

// Candidate Detail Modal (simplified)
const CandidateDetailModal = ({ candidate, onClose, onEdit }: {
    candidate: Candidate;
    onClose: () => void;
    onEdit: () => void;
}) => {
    const statusConfig = STATUS_COLORS[candidate.status] || STATUS_COLORS["Applied"];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Candidate Details</h2>
                    <div className="flex items-center gap-2">
                        <Button onClick={onEdit} variant="secondary" className="gap-2">
                            <Edit2 size={16} />
                            Edit
                        </Button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex items-start gap-4">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                            {candidate.first_name[0]}{candidate.last_name[0]}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                {candidate.first_name} {candidate.last_name}
                            </h3>
                            <p className="text-lg text-gray-600 mb-3">{candidate.position_applied}</p>
                            <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border`}>
                                {candidate.status}
                            </span>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2">
                            <Mail size={16} className="text-gray-400" />
                            <a href={`mailto:${candidate.email}`} className="text-blue-600 hover:underline">{candidate.email}</a>
                        </div>
                        {candidate.phone && (
                            <div className="flex items-center gap-2">
                                <Phone size={16} className="text-gray-400" />
                                <a href={`tel:${candidate.phone}`} className="text-blue-600 hover:underline">{candidate.phone}</a>
                            </div>
                        )}
                        {candidate.location && (
                            <div className="flex items-center gap-2">
                                <MapPin size={16} className="text-gray-400" />
                                <span className="text-gray-700">{candidate.location}</span>
                            </div>
                        )}
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {candidate.department && (
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Department</p>
                                <p className="font-medium text-gray-900">{candidate.department}</p>
                            </div>
                        )}
                        {candidate.source && (
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Source</p>
                                <p className="font-medium text-gray-900">{candidate.source}</p>
                            </div>
                        )}
                        {candidate.years_of_experience !== undefined && (
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Experience</p>
                                <p className="font-medium text-gray-900">{candidate.years_of_experience} years</p>
                            </div>
                        )}
                        {candidate.expected_salary && (
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Expected Salary</p>
                                <p className="font-medium text-gray-900">{candidate.expected_salary}</p>
                            </div>
                        )}
                        {candidate.notice_period && (
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Notice Period</p>
                                <p className="font-medium text-gray-900">{candidate.notice_period}</p>
                            </div>
                        )}
                        {candidate.education && (
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Education</p>
                                <p className="font-medium text-gray-900">{candidate.education}</p>
                            </div>
                        )}
                    </div>

                    {/* Skills */}
                    {candidate.skills.length > 0 && (
                        <div>
                            <p className="text-sm text-gray-500 mb-2">Skills</p>
                            <div className="flex flex-wrap gap-2">
                                {candidate.skills.map((skill, i) => (
                                    <span key={i} className="inline-flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {candidate.notes && (
                        <div>
                            <p className="text-sm text-gray-500 mb-2">Notes</p>
                            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{candidate.notes}</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
