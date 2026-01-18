'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import {
    Staff,
    Outlet,
    CreateStaffInput,
    getStaff,
    createStaff,
    updateStaff,
    deleteStaff,
    getOutlets
} from '@/lib/api';

export default function StaffPage() {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
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
        const [staffData, outletsData] = await Promise.all([
            getStaff(),
            getOutlets()
        ]);
        setStaff(staffData);
        setOutlets(outletsData);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (editingStaff) {
                await updateStaff(editingStaff.id, {
                    name: formData.name,
                    role: formData.role,
                    outlet_id: formData.outlet_id || undefined,
                });
            } else {
                await createStaff(formData);
            }
            setShowModal(false);
            setEditingStaff(null);
            setFormData({ name: '', email: '', password: '', role: 'cashier', outlet_id: '' });
            loadData();
        } catch (err: any) {
            setError(err.message || 'Gagal menyimpan data');
        }
    };

    const openEditModal = (member: Staff) => {
        setEditingStaff(member);
        setFormData({
            name: member.name,
            email: member.email,
            password: '',
            role: member.role as 'manager' | 'cashier',
            outlet_id: member.outlet_id || '',
        });
        setShowModal(true);
    };

    const openCreateModal = () => {
        setEditingStaff(null);
        setFormData({ name: '', email: '', password: '', role: 'cashier', outlet_id: '' });
        setShowModal(true);
    };

    const handleToggleActive = async (member: Staff) => {
        const success = await updateStaff(member.id, { is_active: !member.is_active });
        if (success) {
            loadData();
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'owner':
                return <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Owner</span>;
            case 'manager':
                return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Manager</span>;
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Kasir</span>;
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
                    <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
                    <p className="text-gray-500">Kelola tim dan hak akses</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-purple-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-purple-700"
                >
                    + Tambah Staff
                </button>
            </div>

            {/* Staff List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {staff.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <div className="text-6xl mb-4">👥</div>
                        <p className="text-lg font-medium mb-2">Belum ada staff</p>
                        <p className="text-sm">Tambahkan staff untuk membantu mengelola bisnis Anda</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nama</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Outlet</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {staff.map((member) => (
                                <tr key={member.id} className={`hover:bg-gray-50 ${!member.is_active ? 'opacity-50' : ''}`}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                                <span className="text-purple-600 font-medium text-sm">
                                                    {member.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <span className="font-medium text-gray-900">{member.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">{member.email}</td>
                                    <td className="px-4 py-3">{getRoleBadge(member.role)}</td>
                                    <td className="px-4 py-3 text-gray-500">{member.outlet?.name || '-'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 text-xs rounded-full ${member.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {member.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {member.role !== 'owner' && (
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(member)}
                                                    className="px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded-lg"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleToggleActive(member)}
                                                    className={`px-3 py-1 text-sm rounded-lg ${member.is_active ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                                                >
                                                    {member.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add/Edit Staff Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            {editingStaff ? 'Edit Staff' : 'Tambah Staff'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            {!editingStaff && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                                            placeholder="john@example.com"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </>
                            )}
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Outlet</label>
                                    <select
                                        value={formData.outlet_id}
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
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700"
                                >
                                    {editingStaff ? 'Simpan' : 'Tambah'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
