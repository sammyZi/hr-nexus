import { useState, Fragment, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { X, Calendar, MapPin, User, AlertTriangle, FileText, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { CaseCreate, EmployeeCase } from '@/lib/api';
import { Dropdown } from '@/components/ui/Dropdown';


interface CaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CaseCreate) => Promise<void>;
    caseToEdit?: EmployeeCase;
}

export const CaseModal = ({ isOpen, onClose, onSubmit, caseToEdit }: CaseModalProps) => {
    const [formData, setFormData] = useState<CaseCreate>({
        title: '',
        description: '',
        case_type: 'Disciplinary',
        priority: 'Medium',
        employee_name: '',
        incident_date: '',
        location: '',
        is_confidential: true,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Update form data when caseToEdit changes
    useEffect(() => {
        if (caseToEdit) {
            setFormData({
                title: caseToEdit.title || '',
                description: caseToEdit.description || '',
                case_type: caseToEdit.case_type || 'Disciplinary',
                priority: caseToEdit.priority || 'Medium',
                employee_name: caseToEdit.employee_name || '',
                incident_date: caseToEdit.incident_date || '',
                location: caseToEdit.location || '',
                is_confidential: caseToEdit.is_confidential ?? true,
            });
        } else {
            // Reset form for new case
            setFormData({
                title: '',
                description: '',
                case_type: 'Disciplinary',
                priority: 'Medium',
                employee_name: '',
                incident_date: '',
                location: '',
                is_confidential: true,
            });
        }
    }, [caseToEdit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all border border-gray-100">
                                <div className="flex justify-between items-center mb-6">
                                    <DialogTitle as="h3" className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <div className="p-2 bg-indigo-50 rounded-lg">
                                            <AlertTriangle className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        {caseToEdit ? 'Edit Case Details' : 'Report New Case'}
                                    </DialogTitle>
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Case Title</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.title}
                                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                    className="w-full pl-4 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                                                    placeholder="e.g., Attendance Policy Violation"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Case Type</label>
                                            <Dropdown
                                                options={[
                                                    { value: 'Disciplinary', label: 'Disciplinary' },
                                                    { value: 'Grievance', label: 'Grievance' },
                                                    { value: 'Performance', label: 'Performance' },
                                                    { value: 'Investigation', label: 'Investigation' },
                                                    { value: 'Policy Violation', label: 'Policy Violation' }
                                                ]}
                                                value={formData.case_type}
                                                onChange={(value) => setFormData({ ...formData, case_type: value })}
                                                color="indigo"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Employee Name</label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.employee_name}
                                                    onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                                                    placeholder="Employee involved"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Priority</label>
                                            <Dropdown
                                                options={[
                                                    { value: 'Low', label: 'Low' },
                                                    { value: 'Medium', label: 'Medium' },
                                                    { value: 'High', label: 'High' },
                                                    { value: 'Critical', label: 'Critical' }
                                                ]}
                                                value={formData.priority}
                                                onChange={(value) => setFormData({ ...formData, priority: value })}
                                                color="indigo"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Incident Date (Optional)</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="date"
                                                    value={formData.incident_date ? new Date(formData.incident_date).toISOString().split('T')[0] : ''}
                                                    onChange={(e) => setFormData({ ...formData, incident_date: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Location (Optional)</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={formData.location}
                                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                                                    placeholder="e.g. Office HQ, Remote"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Description</label>
                                        <div className="relative">
                                            <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                            <textarea
                                                required
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none min-h-[120px]"
                                                placeholder="Describe the incident or issue in detail..."
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <input
                                            type="checkbox"
                                            id="confidential"
                                            checked={formData.is_confidential}
                                            onChange={(e) => setFormData({ ...formData, is_confidential: e.target.checked })}
                                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                                        />
                                        <label htmlFor="confidential" className="text-sm text-gray-700 flex items-center gap-2 cursor-pointer">
                                            <Lock className="w-4 h-4 text-gray-500" />
                                            Mark as Confidential Case
                                        </label>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="px-6 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                                        >
                                            {isSubmitting ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    {caseToEdit ? 'Save Changes' : 'Create Case'}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};
