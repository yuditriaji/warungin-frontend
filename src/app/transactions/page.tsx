'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Transaction, getTransactions, voidTransaction, getMe } from '@/lib/api';

const VOID_REASONS = [
    'Pelanggan batal',
    'Salah input produk',
    'Salah input jumlah',
    'Salah input harga',
    'Pembayaran gagal',
    'Duplikat transaksi',
    'Lainnya',
];

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string>('cashier');
    const [showVoidModal, setShowVoidModal] = useState(false);
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const [voidReason, setVoidReason] = useState('');
    const [voidReasonOther, setVoidReasonOther] = useState('');
    const [voidLoading, setVoidLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [txData, userData] = await Promise.all([
            getTransactions(),
            getMe(),
        ]);
        setTransactions(txData);
        setUserRole(userData?.user?.role || 'cashier');
        setLoading(false);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(price);
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

    const getTimeSinceCreation = (dateStr: string) => {
        const created = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - created.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 60) return `${diffMins} menit`;
        if (diffHours < 24) return `${diffHours} jam`;
        return `${Math.floor(diffHours / 24)} hari`;
    };

    const canVoid = (tx: Transaction) => {
        if (tx.status === 'voided') return false;

        const created = new Date(tx.created_at);
        const now = new Date();
        const diffMs = now.getTime() - created.getTime();
        const fiveMinutes = 5 * 60 * 1000;
        const oneDay = 24 * 60 * 60 * 1000;

        if (userRole === 'owner') return true;
        if (userRole === 'manager') return diffMs <= oneDay;
        if (userRole === 'cashier') return diffMs <= fiveMinutes;
        return false;
    };

    const openVoidModal = (tx: Transaction) => {
        setSelectedTx(tx);
        setVoidReason('');
        setVoidReasonOther('');
        setError('');
        setShowVoidModal(true);
    };

    const handleVoid = async () => {
        if (!selectedTx) return;

        const finalReason = voidReason === 'Lainnya' ? voidReasonOther : voidReason;
        if (!finalReason.trim()) {
            setError('Alasan pembatalan wajib diisi');
            return;
        }

        setVoidLoading(true);
        const result = await voidTransaction(selectedTx.id, finalReason);
        setVoidLoading(false);

        if (result.success) {
            setShowVoidModal(false);
            loadData();
        } else {
            setError(result.message);
        }
    };

    const getStatusBadge = (status: string) => {
        if (status === 'voided') {
            return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Batal</span>;
        }
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Selesai</span>;
    };

    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Riwayat Transaksi</h1>
                    <p className="text-gray-500">Lihat semua transaksi penjualan</p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                </div>
            ) : transactions.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada transaksi</h3>
                    <p className="text-gray-500 mb-6">Buat transaksi pertama Anda di halaman Kasir</p>
                    <a href="/pos" className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors inline-block">
                        Buka Kasir
                    </a>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Invoice</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Tanggal</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Items</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Pembayaran</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions.map((tx) => (
                                <tr key={tx.id} className={`hover:bg-gray-50 ${tx.status === 'voided' ? 'opacity-50' : ''}`}>
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-sm text-gray-900">{tx.invoice_number}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {formatDate(tx.created_at)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {tx.items?.length || 0} item
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${tx.payment_method === 'cash'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-purple-100 text-purple-700'
                                            }`}>
                                            {tx.payment_method === 'cash' ? '💵 Tunai' : '📱 ' + tx.payment_method.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(tx.status)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`font-semibold ${tx.status === 'voided' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                            {formatPrice(tx.total)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {canVoid(tx) && (
                                            <button
                                                onClick={() => openVoidModal(tx)}
                                                className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                Batalkan
                                            </button>
                                        )}
                                        {tx.status === 'voided' && (
                                            <span className="text-xs text-gray-400">Dibatalkan</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Void Modal */}
            {showVoidModal && selectedTx && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Batalkan Transaksi</h2>
                        <p className="text-gray-500 text-sm mb-4">
                            Invoice: {selectedTx.invoice_number} • {formatPrice(selectedTx.total)}
                        </p>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-4">{error}</div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Alasan Pembatalan *</label>
                            <select
                                value={voidReason}
                                onChange={(e) => setVoidReason(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-gray-800"
                            >
                                <option value="">Pilih alasan...</option>
                                {VOID_REASONS.map((reason) => (
                                    <option key={reason} value={reason}>{reason}</option>
                                ))}
                            </select>
                        </div>

                        {voidReason === 'Lainnya' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Jelaskan alasan *</label>
                                <textarea
                                    value={voidReasonOther}
                                    onChange={(e) => setVoidReasonOther(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-gray-800"
                                    rows={3}
                                    placeholder="Masukkan alasan pembatalan..."
                                />
                            </div>
                        )}

                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
                            <p className="text-yellow-800 text-sm">
                                ⚠️ Pembatalan akan mengembalikan stok produk dan bahan baku. Aksi ini tercatat di log audit.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowVoidModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
                            >
                                Kembali
                            </button>
                            <button
                                onClick={handleVoid}
                                disabled={voidLoading || !voidReason}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50"
                            >
                                {voidLoading ? 'Memproses...' : 'Batalkan Transaksi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
