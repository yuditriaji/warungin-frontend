'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Transaction, getTransactions } from '@/lib/api';

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTransactions();
    }, []);

    const loadTransactions = async () => {
        setLoading(true);
        const data = await getTransactions();
        setTransactions(data);
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
                                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-gray-50">
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
                                    <td className="px-6 py-4 text-right">
                                        <span className="font-semibold text-gray-900">{formatPrice(tx.total)}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </AppLayout>
    );
}
