'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import {
    RawMaterial,
    getMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    updateMaterialStock,
    getMaterialAlerts,
    CreateMaterialInput
} from '@/lib/api';

export default function MaterialsPage() {
    const [materials, setMaterials] = useState<RawMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
    const [stockMaterial, setStockMaterial] = useState<RawMaterial | null>(null);
    const [stockAdjustment, setStockAdjustment] = useState(0);
    const [alerts, setAlerts] = useState<{ low_stock: RawMaterial[]; out_of_stock: RawMaterial[] }>({ low_stock: [], out_of_stock: [] });
    const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState<CreateMaterialInput>({
        name: '',
        unit: 'kg',
        unit_price: 0,
        stock_qty: 0,
        min_stock_level: 10,
        supplier: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [materialsData, alertsData] = await Promise.all([
            getMaterials(),
            getMaterialAlerts(),
        ]);
        setMaterials(materialsData);
        setAlerts(alertsData);
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
        if (editingMaterial) {
            await updateMaterial(editingMaterial.id, formData);
        } else {
            await createMaterial(formData);
        }
        setShowModal(false);
        setEditingMaterial(null);
        setFormData({ name: '', unit: 'kg', unit_price: 0, stock_qty: 0, min_stock_level: 10, supplier: '' });
        loadData();
    };

    const handleEdit = (material: RawMaterial) => {
        setEditingMaterial(material);
        setFormData({
            name: material.name,
            unit: material.unit,
            unit_price: material.unit_price,
            stock_qty: material.stock_qty,
            min_stock_level: material.min_stock_level || 10,
            supplier: material.supplier,
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Hapus bahan baku ini?')) {
            await deleteMaterial(id);
            loadData();
        }
    };

    const handleStockAdjust = async () => {
        if (stockMaterial && stockAdjustment !== 0) {
            await updateMaterialStock(stockMaterial.id, stockAdjustment);
            setShowStockModal(false);
            setStockMaterial(null);
            setStockAdjustment(0);
            loadData();
        }
    };

    const openStockModal = (material: RawMaterial) => {
        setStockMaterial(material);
        setStockAdjustment(0);
        setShowStockModal(true);
    };

    const filteredMaterials = materials.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
        const minLevel = m.min_stock_level || 10;
        if (filter === 'low') return matchesSearch && m.stock_qty > 0 && m.stock_qty < minLevel;
        if (filter === 'out') return matchesSearch && m.stock_qty <= 0;
        return matchesSearch;
    });

    const getStockBadge = (material: RawMaterial) => {
        const minLevel = material.min_stock_level || 10;
        if (material.stock_qty <= 0) return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Habis</span>;
        if (material.stock_qty < minLevel) return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Rendah</span>;
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Cukup</span>;
    };

    return (
        <AppLayout>
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Bahan Baku</h1>
                        <p className="text-gray-500">Kelola bahan baku dan inventori</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingMaterial(null);
                            setFormData({ name: '', unit: 'kg', unit_price: 0, stock_qty: 0, min_stock_level: 10, supplier: '' });
                            setShowModal(true);
                        }}
                        className="bg-purple-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-purple-700"
                    >
                        + Tambah Bahan
                    </button>
                </div>
            </div>

            {/* Alert Summary */}
            {(alerts.low_stock.length > 0 || alerts.out_of_stock.length > 0) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-2 text-yellow-800">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="font-medium">Peringatan Stok</span>
                    </div>
                    <p className="text-yellow-700 text-sm mt-1">
                        {alerts.out_of_stock.length} habis • {alerts.low_stock.length} stok rendah
                    </p>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex gap-2">
                    {(['all', 'low', 'out'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {f === 'all' ? 'Semua' : f === 'low' ? 'Rendah' : 'Habis'}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1 sm:max-w-xs">
                    <input
                        type="text"
                        placeholder="Cari bahan..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Materials Table */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                </div>
            ) : materials.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada bahan baku</h3>
                    <p className="text-gray-500 mb-4">Tambahkan bahan baku untuk tracking inventori</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harga/Unit</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stok</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredMaterials.map((material) => (
                                    <tr key={material.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">{material.name}</td>
                                        <td className="px-4 py-3 text-gray-500">{material.unit}</td>
                                        <td className="px-4 py-3 text-gray-500">{formatPrice(material.unit_price)}</td>
                                        <td className="px-4 py-3 text-gray-900 font-medium">{material.stock_qty.toFixed(2)}</td>
                                        <td className="px-4 py-3">{getStockBadge(material)}</td>
                                        <td className="px-4 py-3 text-gray-500">{material.supplier || '-'}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openStockModal(material)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                    title="Sesuaikan Stok"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(material)}
                                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(material.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            {editingMaterial ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                                    placeholder="Beras, Minyak, dll"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                                    <select
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                                    >
                                        <option value="kg">kg</option>
                                        <option value="gram">gram</option>
                                        <option value="liter">liter</option>
                                        <option value="ml">ml</option>
                                        <option value="pcs">pcs</option>
                                        <option value="pack">pack</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Harga/Unit</label>
                                    <input
                                        type="number"
                                        value={formData.unit_price}
                                        onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stok Awal</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.stock_qty}
                                        onChange={(e) => setFormData({ ...formData, stock_qty: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Min. Stok</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.min_stock_level}
                                        onChange={(e) => setFormData({ ...formData, min_stock_level: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                                        placeholder="10"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                                <input
                                    type="text"
                                    value={formData.supplier}
                                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                                    placeholder="Nama supplier (opsional)"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700"
                                >
                                    {editingMaterial ? 'Simpan' : 'Tambah'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Stock Adjustment Modal */}
            {showStockModal && stockMaterial && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Sesuaikan Stok</h2>
                        <p className="text-gray-500 mb-4">{stockMaterial.name}</p>
                        <p className="text-sm text-gray-600 mb-4">
                            Stok saat ini: <span className="font-medium">{stockMaterial.stock_qty.toFixed(2)} {stockMaterial.unit}</span>
                        </p>
                        <div className="flex items-center gap-4 mb-6">
                            <button
                                onClick={() => setStockAdjustment(stockAdjustment - 1)}
                                className="w-12 h-12 bg-gray-100 rounded-xl text-xl font-bold hover:bg-gray-200"
                            >
                                -
                            </button>
                            <input
                                type="number"
                                step="0.01"
                                value={stockAdjustment}
                                onChange={(e) => setStockAdjustment(Number(e.target.value))}
                                className="flex-1 text-center text-2xl font-bold border border-gray-200 rounded-xl py-3"
                            />
                            <button
                                onClick={() => setStockAdjustment(stockAdjustment + 1)}
                                className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl text-xl font-bold hover:bg-purple-200"
                            >
                                +
                            </button>
                        </div>
                        <p className="text-center text-sm text-gray-500 mb-4">
                            Stok baru: <span className="font-medium">{(stockMaterial.stock_qty + stockAdjustment).toFixed(2)} {stockMaterial.unit}</span>
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowStockModal(false)}
                                className="flex-1 py-3 border border-gray-200 rounded-xl font-medium"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleStockAdjust}
                                className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-medium"
                            >
                                Simpan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
