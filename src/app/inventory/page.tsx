'use client';

import { useEffect, useState, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { InventoryItem, InventorySummary, getInventory, getInventorySummary, updateStock, Outlet, getOutlets, getCurrentUser, getSubscription, importInventory, downloadImportTemplate, ImportResult } from '@/lib/api';

export default function InventoryPage() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [summary, setSummary] = useState<InventorySummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
    const [adjustModal, setAdjustModal] = useState<{ item: InventoryItem; open: boolean } | null>(null);
    const [adjustQty, setAdjustQty] = useState(0);

    // Outlet filtering
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [selectedOutlet, setSelectedOutlet] = useState<string>('');
    const [hasMultiOutlet, setHasMultiOutlet] = useState(false);

    // Import state
    const [showImportModal, setShowImportModal] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        initPage();
    }, []);

    useEffect(() => {
        loadData();
    }, [filter, selectedOutlet]);

    const initPage = async () => {
        // Check subscription for multi-outlet support
        const subData = await getSubscription();
        const plan = subData?.subscription?.plan || 'gratis';
        const isMultiOutlet = plan === 'bisnis' || plan === 'enterprise';
        setHasMultiOutlet(isMultiOutlet);

        if (isMultiOutlet) {
            const outletData = await getOutlets();
            setOutlets(outletData);
        }

        // Get user's current outlet if assigned
        const userData = await getCurrentUser();
        if (userData?.user?.outlet_id) {
            setSelectedOutlet(userData.user.outlet_id);
        }
    };

    const loadData = async () => {
        setLoading(true);
        const outletId = selectedOutlet || undefined;
        const [inventoryData, summaryData] = await Promise.all([
            getInventory(filter, outletId),
            getInventorySummary(outletId),
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        setImportResult(null);

        const result = await importInventory(file, selectedOutlet || undefined);
        setImportResult(result);
        setImporting(false);

        if (result && result.success_count > 0) {
            loadData(); // Reload inventory data
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <AppLayout>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Stok & Inventori</h1>
                    <p className="text-gray-500">Pantau stok produk</p>
                </div>
                <button
                    onClick={() => setShowImportModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Import Excel
                </button>
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

            {/* Outlet Filter - only for multi-outlet plans */}
            {hasMultiOutlet && outlets.length > 0 && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filter per Outlet</label>
                    <select
                        value={selectedOutlet}
                        onChange={(e) => setSelectedOutlet(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                        <option value="">Semua Outlet</option>
                        {outlets.map((outlet) => (
                            <option key={outlet.id} value={outlet.id}>
                                {outlet.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Status Filter */}
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
                                        {item.use_material_stock ? (
                                            <div className="flex flex-col items-center">
                                                <span className="text-lg font-bold text-gray-900">{item.stock_qty}</span>
                                                <span className="text-xs text-blue-600 flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                    </svg>
                                                    dari bahan
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-lg font-bold text-gray-900">{item.stock_qty}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">{getStatusBadge(item.status)}</td>
                                    <td className="px-4 py-3 text-right text-gray-600">{formatPrice(item.stock_value)}</td>
                                    <td className="px-4 py-3 text-right">
                                        {item.use_material_stock ? (
                                            <span className="text-xs text-gray-400">Kelola di Bahan Baku</span>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setAdjustModal({ item, open: true });
                                                    setAdjustQty(0);
                                                }}
                                                className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                                            >
                                                Ubah Stok
                                            </button>
                                        )}
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

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Import Stok dari Excel</h2>
                            <button
                                onClick={() => {
                                    setShowImportModal(false);
                                    setImportResult(null);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {!importResult ? (
                            <>
                                <p className="text-gray-600 mb-4">
                                    Upload file Excel (.xlsx) atau CSV dengan format yang sesuai untuk mengimport data stok produk.
                                </p>

                                <button
                                    onClick={downloadImportTemplate}
                                    className="w-full mb-4 py-2 px-4 border border-purple-300 text-purple-600 rounded-xl hover:bg-purple-50 flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download Template
                                </button>

                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        accept=".xlsx,.xls,.csv"
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className="cursor-pointer"
                                    >
                                        {importing ? (
                                            <div className="flex flex-col items-center">
                                                <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-2"></div>
                                                <p className="text-gray-600">Mengupload...</p>
                                            </div>
                                        ) : (
                                            <>
                                                <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                                <p className="text-gray-600">Klik untuk pilih file</p>
                                                <p className="text-sm text-gray-400 mt-1">.xlsx, .xls, atau .csv</p>
                                            </>
                                        )}
                                    </label>
                                </div>

                                <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                                    <p className="text-sm text-blue-700">
                                        <strong>Format kolom:</strong> Nama Produk, SKU, Stok, Harga, Modal
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div>
                                <div className={`p-4 rounded-xl mb-4 ${importResult.failed_count === 0 ? 'bg-green-50' : 'bg-yellow-50'}`}>
                                    <p className={`font-medium ${importResult.failed_count === 0 ? 'text-green-700' : 'text-yellow-700'}`}>
                                        Import selesai!
                                    </p>
                                    <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                                        <div>
                                            <p className="text-2xl font-bold text-gray-900">{importResult.total_rows}</p>
                                            <p className="text-xs text-gray-500">Total Baris</p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-green-600">{importResult.success_count}</p>
                                            <p className="text-xs text-gray-500">Berhasil</p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-red-600">{importResult.failed_count}</p>
                                            <p className="text-xs text-gray-500">Gagal</p>
                                        </div>
                                    </div>
                                </div>

                                {importResult.errors && importResult.errors.length > 0 && (
                                    <div className="max-h-32 overflow-auto bg-red-50 rounded-xl p-3 mb-4">
                                        <p className="text-sm font-medium text-red-700 mb-1">Error:</p>
                                        {importResult.errors.map((error, idx) => (
                                            <p key={idx} className="text-xs text-red-600">{error}</p>
                                        ))}
                                    </div>
                                )}

                                <button
                                    onClick={() => {
                                        setShowImportModal(false);
                                        setImportResult(null);
                                    }}
                                    className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700"
                                >
                                    Selesai
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
