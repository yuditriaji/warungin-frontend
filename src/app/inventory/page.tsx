'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { InventoryItem, InventorySummary, getInventory, getInventorySummary, updateStock } from '@/lib/api';

export default function InventoryPage() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [summary, setSummary] = useState<InventorySummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
    const [adjustModal, setAdjustModal] = useState<{ item: InventoryItem; open: boolean } | null>(null);
    const [adjustQty, setAdjustQty] = useState(0);

    useEffect(() => {
        loadData();
    }, [filter]);

    const loadData = async () => {
        setLoading(true);
        const [inventoryData, summaryData] = await Promise.all([
            getInventory(filter),
            getInventorySummary(),
        ]);
        setInventory(inventoryData);
        setSummary(summaryData);
        setLoading(false);
    };

    const handleAdjust = async () => {
        if (!adjustModal?.item) return;
        const success = await updateStock(adjustModal.item.product_id, adjustQty);
        if (success) {
            loadData();
            setAdjustModal(null);
            setAdjustQty(0);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'out':
                return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Habis</span>;
            case 'low':
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Rendah</span>;
            default:
                return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Aman</span>;
        }
    };

    return (
        <AppLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Stok & Inventori</h1>
                <p className="text-gray-500">Pantau stok produk</p>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <p className="text-sm text-gray-500">Total Produk</p>
                        <p className="text-2xl font-bold text-gray-900">{summary.total_products}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <p className="text-sm text-gray-500">Nilai Stok</p>
                        <p className="text-2xl font-bold text-gray-900">{formatPrice(summary.total_stock_value)}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-yellow-200 p-4 bg-yellow-50">
                        <p className="text-sm text-yellow-600">Stok Rendah</p>
                        <p className="text-2xl font-bold text-yellow-700">{summary.low_stock_count}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-red-200 p-4 bg-red-50">
                        <p className="text-sm text-red-600">Stok Habis</p>
                        <p className="text-2xl font-bold text-red-700">{summary.out_of_stock_count}</p>
                    </div>
                </div>
            )}

            {/* Filter */}
            <div className="flex gap-2 mb-6">
                {(['all', 'low', 'out'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl font-medium transition-colors ${filter === f
                                ? 'bg-purple-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        {f === 'all' && 'Semua'}
                        {f === 'low' && '⚠️ Stok Rendah'}
                        {f === 'out' && '❌ Habis'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                </div>
            ) : inventory.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <p className="text-gray-500">Tidak ada produk dengan filter ini</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Produk</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Stok</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nilai</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {inventory.map((item) => (
                                <tr key={item.product_id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-gray-900">{item.product_name}</p>
                                        {item.sku && <p className="text-xs text-gray-500">{item.sku}</p>}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="text-lg font-bold text-gray-900">{item.stock_qty}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center">{getStatusBadge(item.status)}</td>
                                    <td className="px-4 py-3 text-right text-gray-600">{formatPrice(item.stock_value)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => {
                                                setAdjustModal({ item, open: true });
                                                setAdjustQty(0);
                                            }}
                                            className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                                        >
                                            Ubah Stok
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Adjust Stock Modal */}
            {adjustModal?.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4">
                        <h2 className="text-lg font-bold text-gray-900 mb-2">Ubah Stok</h2>
                        <p className="text-gray-500 mb-4">{adjustModal.item.product_name}</p>
                        <p className="text-sm text-gray-600 mb-2">Stok saat ini: <strong>{adjustModal.item.stock_qty}</strong></p>

                        <div className="flex items-center gap-4 mb-4">
                            <button
                                onClick={() => setAdjustQty(adjustQty - 1)}
                                className="w-10 h-10 bg-red-100 text-red-600 rounded-xl font-bold text-xl"
                            >
                                -
                            </button>
                            <input
                                type="number"
                                value={adjustQty}
                                onChange={(e) => setAdjustQty(Number(e.target.value))}
                                className="flex-1 text-center text-2xl font-bold border border-gray-200 rounded-xl py-2"
                            />
                            <button
                                onClick={() => setAdjustQty(adjustQty + 1)}
                                className="w-10 h-10 bg-green-100 text-green-600 rounded-xl font-bold text-xl"
                            >
                                +
                            </button>
                        </div>

                        <p className="text-sm text-center text-gray-500 mb-4">
                            Stok baru: <strong>{adjustModal.item.stock_qty + adjustQty}</strong>
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setAdjustModal(null)}
                                className="flex-1 py-3 border border-gray-200 rounded-xl font-medium"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleAdjust}
                                disabled={adjustQty === 0}
                                className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-medium disabled:opacity-50"
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
