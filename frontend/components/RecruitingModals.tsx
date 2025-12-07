"use client";

import { useState } from "react";
import { X, Calendar as CalendarIcon, Clock, Video, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { candidateApi, Candidate, CandidateCreate, Interview } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { motion } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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

const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true
    });
};

export const CandidateModal = ({ isOpen, onClose, onSuccess, candidate }: {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8"
            >
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {candidate ? "Edit Candidate" : "Add New Candidate"}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
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
                                    placeholder="e.g., LinkedIn, Referral"
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

                    <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                        <Button type="button" onClick={onClose} variant="secondary">Cancel</Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? "Saving..." : candidate ? "Update" : "Add Candidate"}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export const CandidateDetailModal = ({ candidate, onClose, onEdit, onScheduleInterview }: {
    candidate: Candidate;
    onClose: () => void;
    onEdit: () => void;
    onScheduleInterview: () => void;
}) => {
    const statusConfig = STATUS_COLORS[candidate.status] || STATUS_COLORS["Applied"];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8"
            >
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                    <h2 className="text-2xl font-bold text-gray-900">Candidate Details</h2>
                    <div className="flex items-center gap-2">
                        <Button onClick={onScheduleInterview} variant="secondary" className="gap-2">
                            <CalendarIcon size={16} />
                            Schedule
                        </Button>
                        <Button onClick={onEdit} variant="secondary" className="gap-2">
                            <UserIcon size={16} />
                            Edit
                        </Button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
                    <div className="flex items-start gap-4">
                        <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                            {candidate.first_name[0]}{candidate.last_name[0]}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                {candidate.first_name} {candidate.last_name}
                            </h3>
                            <p className="text-lg text-gray-600 mb-3">{candidate.position_applied}</p>
                            <div className="flex flex-wrap gap-2">
                                <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border`}>
                                    {candidate.status}
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-full">
                                    <Clock size={14} />
                                    Applied {new Date(candidate.applied_date).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {candidate.interviews && candidate.interviews.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                <CalendarIcon size={18} />
                                Scheduled Interviews ({candidate.interviews.length})
                            </h4>
                            <div className="space-y-2">
                                {candidate.interviews.map((interview, idx) => (
                                    <div key={idx} className="bg-white rounded-lg p-3 border border-blue-100">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900">{interview.interview_type}</p>
                                                <p className="text-sm text-gray-600">{formatDateTime(interview.date)}</p>
                                                {interview.interviewer_name && (
                                                    <p className="text-sm text-gray-500 mt-1">with {interview.interviewer_name}</p>
                                                )}
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full ${interview.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' :
                                                    interview.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                                        'bg-gray-100 text-gray-700'
                                                }`}>
                                                {interview.status}
                                            </span>
                                        </div>
                                        {interview.meeting_link && (
                                            <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer"
                                                className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-2">
                                                <Video size={14} />
                                                Join Meeting
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {candidate.email && (
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Email</p>
                                <a href={`mailto:${candidate.email}`} className="text-blue-600 hover:underline">{candidate.email}</a>
                            </div>
                        )}
                        {candidate.phone && (
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Phone</p>
                                <a href={`tel:${candidate.phone}`} className="text-blue-600 hover:underline">{candidate.phone}</a>
                            </div>
                        )}
                        {candidate.location && (
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Location</p>
                                <p className="font-medium text-gray-900">{candidate.location}</p>
                            </div>
                        )}
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
                    </div>

                    {candidate.skills.length > 0 && (
                        <div>
                            <p className="text-sm text-gray-500 mb-2">Skills</p>
                            <div className="flex flex-wrap gap-2">
                                {candidate.skills.map((skill, i) => (
                                    <span key={i} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

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

export const ScheduleInterviewModal = ({ candidate, onClose, onSuccess }: {
    candidate: Candidate;
    onClose: () => void;
    onSuccess: () => void;
}) => {
    const { showToast } = useToast();
    const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
    const [interviewData, setInterviewData] = useState({
        interview_type: "Phone Interview",
        interviewer_name: "",
        meeting_link: "",
        duration_minutes: 60,
        notes: "",
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDateTime) {
            showToast('error', 'Please select date and time');
            return;
        }

        setSubmitting(true);
        try {
            await candidateApi.scheduleInterview(candidate.id, {
                interview_date: selectedDateTime.toISOString(),
                interview_type: interviewData.interview_type,
                interviewer_name: interviewData.interviewer_name || undefined,
                meeting_link: interviewData.meeting_link || undefined,
                duration_minutes: interviewData.duration_minutes,
                notes: interviewData.notes || undefined,
            });
            onSuccess();
        } catch (error) {
            showToast('error', 'Failed to schedule interview');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8"
            >
                <div className="bg-blue-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Schedule Interview</h2>
                        <p className="text-blue-100 mt-1">{candidate.first_name} {candidate.last_name} - {candidate.position_applied}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Interview Type *</label>
                        <select
                            required
                            value={interviewData.interview_type}
                            onChange={(e) => setInterviewData({ ...interviewData, interview_type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option>Phone Interview</option>
                            <option>Technical Interview</option>
                            <option>Final Interview</option>
                            <option>HR Round</option>
                            <option>Culture Fit</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time *</label>
                        <DatePicker
                            selected={selectedDateTime}
                            onChange={(date) => setSelectedDateTime(date)}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            dateFormat="MMMM d, yyyy h:mm aa"
                            minDate={new Date()}
                            placeholderText="Select date and time"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Interviewer Name</label>
                            <input
                                type="text"
                                value={interviewData.interviewer_name}
                                onChange={(e) => setInterviewData({ ...interviewData, interviewer_name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                            <input
                                type="number"
                                min="15"
                                step="15"
                                value={interviewData.duration_minutes}
                                onChange={(e) => setInterviewData({ ...interviewData, duration_minutes: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Link (Zoom, Google Meet, etc.)</label>
                        <input
                            type="url"
                            placeholder="https://..."
                            value={interviewData.meeting_link}
                            onChange={(e) => setInterviewData({ ...interviewData, meeting_link: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                        <textarea
                            rows={3}
                            value={interviewData.notes}
                            onChange={(e) => setInterviewData({ ...interviewData, notes: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                        <Button type="button" onClick={onClose} variant="secondary">Cancel</Button>
                        <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {submitting ? "Scheduling..." : "Schedule Interview"}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};
