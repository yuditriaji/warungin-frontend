'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import {
    Outlet,
    OutletStats,
    CreateOutletInput,
    getOutlets,
    createOutlet,
    updateOutlet,
    deleteOutlet,
    getOutletStats
} from '@/lib/api';

export default function OutletsPage() {
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [stats, setStats] = useState<Record<string, OutletStats>>({});
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState<CreateOutletInput>({
        name: '',
        address: '',
        phone: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const data = await getOutlets();
        setOutlets(data);

        // Load stats for each outlet
        const statsMap: Record<string, OutletStats> = {};
        for (const outlet of data) {
            const outletStats = await getOutletStats(outlet.id);
            if (outletStats) {
                statsMap[outlet.id] = outletStats;
            }
        }
        setStats(statsMap);
        setLoading(false);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (editingOutlet) {
                await updateOutlet(editingOutlet.id, formData);
            } else {
                await createOutlet(formData);
            }
            setShowModal(false);
            setEditingOutlet(null);
            setFormData({ name: '', address: '', phone: '' });
            loadData();
        } catch (err: any) {
            setError(err.message || 'Gagal menyimpan outlet');
        }
    };

    const openEditModal = (outlet: Outlet) => {
        setEditingOutlet(outlet);
        setFormData({
            name: outlet.name,
            address: outlet.address || '',
            phone: outlet.phone || '',
        });
        setShowModal(true);
    };

    const openCreateModal = () => {
        setEditingOutlet(null);
        setFormData({ name: '', address: '', phone: '' });
        setShowModal(true);
    };

    const handleDelete = async (outlet: Outlet) => {
        if (confirm(`Hapus outlet "${outlet.name}"?`)) {
            const success = await deleteOutlet(outlet.id);
            if (success) {
                loadData();
            } else {
                alert('Gagal menghapus outlet');
            }
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
                    <h1 className="text-2xl font-bold text-gray-900">Outlet</h1>
                    <p className="text-gray-500">Kelola cabang/lokasi usaha Anda</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-purple-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-purple-700"
                >
                    + Tambah Outlet
                </button>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-blue-700">
                    <span className="font-medium">💡 Tips:</span> Outlet memungkinkan Anda mengelola beberapa cabang usaha.
                    Setiap outlet dapat memiliki stok dan transaksi terpisah.
                </p>
            </div>

            {/* Outlets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {outlets.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        <div className="text-6xl mb-4">🏪</div>
                        <p className="text-lg font-medium mb-2">Belum ada outlet</p>
                        <p className="text-sm">Tambahkan outlet pertama Anda untuk mulai mengelola multi-cabang</p>
                    </div>
                ) : (
                    outlets.map((outlet) => {
                        const outletStats = stats[outlet.id];
                        return (
                            <div key={outlet.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full ${outlet.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {outlet.is_active ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                </div>
                                <h3 className="font-semibold text-gray-900 text-lg mb-1">{outlet.name}</h3>
                                {outlet.address && (
                                    <p className="text-sm text-gray-500 mb-1">📍 {outlet.address}</p>
                                )}
                                {outlet.phone && (
                                    <p className="text-sm text-gray-500">📞 {outlet.phone}</p>
                                )}

                                {/* Stats Grid */}
                                {outletStats && (
                                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100">
                                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                                            <p className="text-xs text-gray-500">Hari Ini</p>
                                            <p className="font-semibold text-gray-900 text-sm">{formatPrice(outletStats.today_sales)}</p>
                                            <p className="text-xs text-gray-400">{outletStats.today_tx_count} tx</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-2 text-center">
                                            <p className="text-xs text-gray-500">Bulan Ini</p>
                                            <p className="font-semibold text-gray-900 text-sm">{formatPrice(outletStats.month_sales)}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => openEditModal(outlet)}
                                        className="flex-1 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(outlet)}
                                        className="flex-1 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Add/Edit Outlet Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            {editingOutlet ? 'Edit Outlet' : 'Tambah Outlet'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Outlet *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Cabang Jakarta Selatan"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    rows={2}
                                    placeholder="Jl. Sudirman No. 123"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="021-1234567"
                                />
                            </div>
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
                                    {editingOutlet ? 'Simpan' : 'Tambah'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
