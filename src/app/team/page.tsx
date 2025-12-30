'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Staff, Outlet, getStaff, createStaff, getOutlets, getActivityLogs, ActivityLog, CreateStaffInput } from '@/lib/api';

export default function TeamPage() {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showLogsModal, setShowLogsModal] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState<CreateStaffInput>({
        name: '',
        email: '',
        password: '',
        role: 'cashier',
        outlet_id: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [staffData, outletData] = await Promise.all([
            getStaff(),
            getOutlets(),
        ]);
        setStaff(staffData);
        setOutlets(outletData);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await createStaff(formData);
            setShowModal(false);
            setFormData({ name: '', email: '', password: '', role: 'cashier', outlet_id: '' });
            loadData();
        } catch (err: any) {
            setError(err.message || 'Gagal menambahkan staff');
        }
    };

    const handleViewLogs = async () => {
        const logsData = await getActivityLogs();
        setLogs(logsData);
        setShowLogsModal(true);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'owner':
                return <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Owner</span>;
            case 'manager':
                return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Manager</span>;
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Kasir</span>;
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tim</h1>
                    <p className="text-gray-500">Kelola anggota tim Anda</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleViewLogs}
                        className="px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
                    >
                        📋 Log Aktivitas
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-purple-700"
                    >
                        + Tambah Staff
                    </button>
                </div>
            </div>

            {/* Staff Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staff.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        Belum ada staff. Tambahkan staff pertama Anda!
                    </div>
                ) : (
                    staff.map((member) => (
                        <div key={member.id} className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex items-start gap-3">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                    <span className="text-purple-600 font-semibold text-lg">
                                        {member.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">{member.name}</h3>
                                    <p className="text-sm text-gray-500">{member.email}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        {getRoleBadge(member.role)}
                                        {member.outlet && (
                                            <span className="text-xs text-gray-500">
                                                📍 {member.outlet.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span className={`w-2 h-2 rounded-full ${member.is_active ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Staff Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Tambah Staff</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'manager' | 'cashier' })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                                >
                                    <option value="cashier">Kasir</option>
                                    <option value="manager">Manager</option>
                                </select>
                            </div>
                            {outlets.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Outlet (Opsional)</label>
                                    <select
                                        value={formData.outlet_id || ''}
                                        onChange={(e) => setFormData({ ...formData, outlet_id: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                                    >
                                        <option value="">Semua Outlet</option>
                                        {outlets.map((outlet) => (
                                            <option key={outlet.id} value={outlet.id}>{outlet.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="flex gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-700"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-xl font-medium"
                                >
                                    Tambah
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Activity Logs Modal */}
            {showLogsModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[80vh] overflow-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Log Aktivitas</h2>
                            <button
                                onClick={() => setShowLogsModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                ✕
                            </button>
                        </div>
                        {logs.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">Belum ada aktivitas</p>
                        ) : (
                            <div className="space-y-3">
                                {logs.map((log) => (
                                    <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                            <span className="text-purple-600 text-xs font-medium">
                                                {log.user?.name?.charAt(0) || '?'}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-900">
                                                <span className="font-medium">{log.user?.name || 'User'}</span>
                                                {' - '}{log.action}
                                            </p>
                                            <p className="text-xs text-gray-500">{log.details}</p>
                                        </div>
                                        <span className="text-xs text-gray-400">{formatDate(log.created_at)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
