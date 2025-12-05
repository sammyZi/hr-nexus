"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { invitationApi, userApi, organizationApi, Invitation, User, OrganizationStats } from '@/lib/api';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { showToast } from '@/components/ui/Toast';
import { 
    UserPlus, 
    Mail, 
    Trash2, 
    Users, 
    Shield, 
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Building2,
    BarChart3,
    FileText,
    CheckSquare,
    Edit2,
    Save,
    X
} from 'lucide-react';

export default function SettingsPage() {
    const router = useRouter();
    const { organization, loading: orgLoading, refreshOrganization } = useOrganization();
    const [activeTab, setActiveTab] = useState<'organization' | 'invitations' | 'users'>('organization');
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<OrganizationStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('employee');
    const [submitting, setSubmitting] = useState(false);

    // Organization editing state
    const [isEditingOrg, setIsEditingOrg] = useState(false);
    const [editOrgName, setEditOrgName] = useState('');
    const [editOrgLogo, setEditOrgLogo] = useState('');

    // Check if user is admin
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        // Get user role from JWT token
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUserRole(payload.role);
                
                if (payload.role !== 'admin') {
                    showToast('Access denied. Admin privileges required.', 'error');
                    router.push('/dashboard');
                }
            } catch (error) {
                console.error('Failed to decode token:', error);
                router.push('/dashboard');
            }
        }
    }, [router]);

    useEffect(() => {
        if (userRole === 'admin') {
            loadData();
        }
    }, [userRole]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [invitationsData, usersData, statsData] = await Promise.all([
                invitationApi.getAll(),
                userApi.getAll(),
                organizationApi.getStats()
            ]);
            setInvitations(invitationsData);
            setUsers(usersData);
            setStats(statsData);
        } catch (error: any) {
            console.error('Failed to load data:', error);
            showToast(error.response?.data?.detail || 'Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditOrganization = () => {
        if (organization) {
            setEditOrgName(organization.name);
            setEditOrgLogo(organization.logo_url || '');
            setIsEditingOrg(true);
        }
    };

    const handleCancelEditOrganization = () => {
        setIsEditingOrg(false);
        setEditOrgName('');
        setEditOrgLogo('');
    };

    const handleSaveOrganization = async () => {
        if (!editOrgName.trim()) {
            showToast('Organization name is required', 'error');
            return;
        }

        try {
            setSubmitting(true);
            await organizationApi.update({
                name: editOrgName,
                logo_url: editOrgLogo || undefined
            });
            showToast('Organization updated successfully!', 'success');
            setIsEditingOrg(false);
            await refreshOrganization();
        } catch (error: any) {
            console.error('Failed to update organization:', error);
            showToast(error.response?.data?.detail || 'Failed to update organization', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleInviteUser = async () => {
        if (!inviteEmail.trim()) {
            showToast('Please enter an email address', 'error');
            return;
        }

        try {
            setSubmitting(true);
            await invitationApi.create({
                email: inviteEmail,
                role: inviteRole
            });
            showToast('Invitation sent successfully!', 'success');
            setShowInviteModal(false);
            setInviteEmail('');
            setInviteRole('employee');
            loadData();
        } catch (error: any) {
            console.error('Failed to send invitation:', error);
            const errorMessage = error.userMessage || 
                                error.response?.data?.detail || 
                                error.message || 
                                'Failed to send invitation';
            showToast(errorMessage, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRevokeInvitation = async (id: string) => {
        if (!confirm('Are you sure you want to revoke this invitation?')) {
            return;
        }

        try {
            await invitationApi.revoke(id);
            showToast('Invitation revoked successfully', 'success');
            loadData();
        } catch (error: any) {
            console.error('Failed to revoke invitation:', error);
            showToast(error.response?.data?.detail || 'Failed to revoke invitation', 'error');
        }
    };

    const handleRemoveUser = async (id: string, email: string) => {
        if (!confirm(`Are you sure you want to remove ${email} from the organization?`)) {
            return;
        }

        try {
            await userApi.remove(id);
            showToast('User removed successfully', 'success');
            loadData();
        } catch (error: any) {
            console.error('Failed to remove user:', error);
            showToast(error.response?.data?.detail || 'Failed to remove user', 'error');
        }
    };

    const handleUpdateRole = async (id: string, newRole: string) => {
        try {
            await userApi.updateRole(id, newRole);
            showToast('User role updated successfully', 'success');
            loadData();
        } catch (error: any) {
            console.error('Failed to update role:', error);
            showToast(error.response?.data?.detail || 'Failed to update role', 'error');
        }
    };

    if (orgLoading || loading || userRole !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="text-yellow-500" size={18} />;
            case 'accepted':
                return <CheckCircle className="text-green-500" size={18} />;
            case 'expired':
                return <XCircle className="text-red-500" size={18} />;
            default:
                return <AlertCircle className="text-gray-500" size={18} />;
        }
    };

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Settings</h1>
                <p className="text-sm sm:text-base text-gray-600">Manage your organization settings, users, and invitations</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 sm:gap-4 mb-6 border-b border-gray-200 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('organization')}
                    className={`px-3 sm:px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === 'organization'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                >
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <Building2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                        <span className="text-sm sm:text-base">Organization</span>
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-3 sm:px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === 'users'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                >
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <Users size={16} className="sm:w-[18px] sm:h-[18px]" />
                        <span className="text-sm sm:text-base">Users</span>
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('invitations')}
                    className={`px-3 sm:px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === 'invitations'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                >
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <Mail size={16} className="sm:w-[18px] sm:h-[18px]" />
                        <span className="text-sm sm:text-base">Invitations</span>
                    </div>
                </button>
            </div>

            {/* Organization Tab */}
            {activeTab === 'organization' && (
                <div className="space-y-6">
                    {/* Organization Details */}
                    <Card className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Organization Details</h2>
                            {!isEditingOrg && (
                                <Button
                                    onClick={handleEditOrganization}
                                    className="flex items-center gap-2"
                                >
                                    <Edit2 size={16} />
                                    Edit
                                </Button>
                            )}
                        </div>

                        {isEditingOrg ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Organization Name *
                                    </label>
                                    <Input
                                        type="text"
                                        value={editOrgName}
                                        onChange={(e) => setEditOrgName(e.target.value)}
                                        placeholder="Acme Corporation"
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Logo URL (optional)
                                    </label>
                                    <Input
                                        type="text"
                                        value={editOrgLogo}
                                        onChange={(e) => setEditOrgLogo(e.target.value)}
                                        placeholder="https://example.com/logo.png"
                                        className="w-full"
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <Button
                                        onClick={handleSaveOrganization}
                                        disabled={submitting}
                                        className="flex items-center gap-2"
                                    >
                                        <Save size={16} />
                                        {submitting ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={handleCancelEditOrganization}
                                        disabled={submitting}
                                        className="flex items-center gap-2"
                                    >
                                        <X size={16} />
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">Organization Name</p>
                                    <p className="text-lg text-gray-900">{organization?.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">Slug</p>
                                    <p className="text-lg text-gray-900">{organization?.slug}</p>
                                </div>
                                {organization?.logo_url && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 mb-2">Logo</p>
                                        <img 
                                            src={organization.logo_url} 
                                            alt="Organization logo" 
                                            className="h-16 w-auto object-contain"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">Created</p>
                                    <p className="text-lg text-gray-900">
                                        {organization?.created_at && formatDate(organization.created_at)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Organization Statistics */}
                    {stats && (
                        <Card className="p-4 sm:p-6">
                            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Statistics</h2>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                                    <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                                        <Users className="text-blue-600" size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm font-medium text-gray-500">Active Users</p>
                                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.active_users}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                                    <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                                        <FileText className="text-green-600" size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm font-medium text-gray-500">Documents</p>
                                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total_documents}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                                    <div className="p-2 sm:p-3 bg-purple-100 rounded-lg">
                                        <CheckSquare className="text-purple-600" size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm font-medium text-gray-500">Total Tasks</p>
                                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total_tasks}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 col-span-2 lg:col-span-1">
                                    <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg">
                                        <BarChart3 className="text-yellow-600" size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs sm:text-sm font-medium text-gray-500">Completed Tasks</p>
                                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.completed_tasks}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {stats.total_tasks > 0 
                                                ? `${Math.round((stats.completed_tasks / stats.total_tasks) * 100)}% completion rate`
                                                : 'No tasks yet'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {/* Invitations Tab */}
            {activeTab === 'invitations' && (
                <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Pending Invitations</h2>
                        <Button
                            onClick={() => setShowInviteModal(true)}
                            className="flex items-center gap-2 w-full sm:w-auto"
                        >
                            <UserPlus size={18} />
                            Invite User
                        </Button>
                    </div>

                    {invitations.length === 0 ? (
                        <Card className="p-12 text-center">
                            <Mail size={48} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No pending invitations</h3>
                            <p className="text-gray-600 mb-4">Invite team members to join your organization</p>
                            <Button onClick={() => setShowInviteModal(true)}>
                                Send Invitation
                            </Button>
                        </Card>
                    ) : (
                        <div className="space-y-3 sm:space-y-4">
                            {invitations.map((invitation) => (
                                <Card key={invitation.id} className="p-4 sm:p-6">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 sm:justify-between">
                                        <div className="flex items-start gap-3 sm:gap-4 flex-1 w-full sm:w-auto">
                                            <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
                                                {getStatusIcon(invitation.status)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 truncate">{invitation.email}</p>
                                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1 text-xs sm:text-sm text-gray-600">
                                                    <span className="flex items-center gap-1 whitespace-nowrap">
                                                        <Shield size={12} className="sm:w-3.5 sm:h-3.5" />
                                                        {invitation.role}
                                                    </span>
                                                    <span className="flex items-center gap-1 whitespace-nowrap">
                                                        <Clock size={12} className="sm:w-3.5 sm:h-3.5" />
                                                        <span className="hidden sm:inline">Sent {formatDate(invitation.created_at)}</span>
                                                        <span className="sm:hidden">{formatDate(invitation.created_at)}</span>
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                                                        invitation.status === 'pending' 
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : invitation.status === 'accepted'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {invitation.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {invitation.status === 'pending' && (
                                            <Button
                                                variant="destructive"
                                                onClick={() => handleRevokeInvitation(invitation.id)}
                                                className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0"
                                            >
                                                <Trash2 size={16} />
                                                Revoke
                                            </Button>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div>
                    <div className="mb-4 sm:mb-6">
                        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Organization Users</h2>
                        <p className="text-sm sm:text-base text-gray-600 mt-1">{users.length} total users</p>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                        {users.map((user) => (
                            <Card key={user.id} className="p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 sm:justify-between">
                                    <div className="flex items-center gap-3 sm:gap-4 flex-1 w-full sm:w-auto">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-blue-600 font-semibold">
                                                {user.email.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">{user.email}</p>
                                            <p className="text-xs sm:text-sm text-gray-600">
                                                Joined {formatDate(user.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                                        <Select
                                            value={user.role}
                                            onChange={(newRole) => handleUpdateRole(user.id, newRole)}
                                            options={[
                                                { value: 'admin', label: 'Admin' },
                                                { value: 'employee', label: 'Employee' }
                                            ]}
                                            className="flex-1 sm:w-32"
                                        />
                                        <Button
                                            variant="destructive"
                                            onClick={() => handleRemoveUser(user.id, user.email)}
                                            className="flex items-center gap-2 flex-shrink-0"
                                        >
                                            <Trash2 size={16} />
                                            <span className="hidden sm:inline">Remove</span>
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Invite User Modal */}
            <Modal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                title="Invite User"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                        </label>
                        <Input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="user@example.com"
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Role
                        </label>
                        <Select
                            value={inviteRole}
                            onChange={(newRole) => setInviteRole(newRole)}
                            options={[
                                { value: 'employee', label: 'Employee' },
                                { value: 'admin', label: 'Admin' }
                            ]}
                            className="w-full"
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button
                            onClick={handleInviteUser}
                            disabled={submitting}
                            className="flex-1"
                        >
                            {submitting ? 'Sending...' : 'Send Invitation'}
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => setShowInviteModal(false)}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
