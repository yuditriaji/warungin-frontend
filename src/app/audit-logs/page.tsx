'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { TransactionAuditLog, getAuditLogs, getCurrentUser } from '@/lib/api';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<TransactionAuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [userRole, setUserRole] = useState<string>('');

    useEffect(() => {
        checkAccess();
    }, []);

    useEffect(() => {
        if (userRole === 'manager' || userRole === 'owner') {
            loadLogs();
        }
    }, [startDate, endDate, userRole]);

    const checkAccess = async () => {
        const userData = await getCurrentUser();
        const role = userData?.user?.role || 'cashier';
        setUserRole(role);

        if (role !== 'manager' && role !== 'owner') {
            setError('Hanya manager dan owner yang dapat melihat halaman ini');
            setLoading(false);
        }
    };

    const loadLogs = async () => {
        setLoading(true);
        const data = await getAuditLogs(startDate || undefined, endDate || undefined);
        setLogs(data);
        setLoading(false);
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

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const getActionBadge = (action: string) => {
        switch (action) {
            case 'void':
                return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Pembatalan</span>;
            case 'correction':
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Koreksi</span>;
            case 'refund':
                return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Refund</span>;
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">{action}</span>;
        }
    };

    const parseOldValues = (json: string) => {
        try {
            return JSON.parse(json);
        } catch {
            return null;
        }
    };

    if (error && userRole !== 'manager' && userRole !== 'owner') {
        return (
            <AppLayout>
                <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-xl font-bold text-red-700 mb-2">Akses Ditolak</h2>
                    <p className="text-red-600">{error}</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
                    <p className="text-gray-500">Riwayat perubahan transaksi</p>
                </div>
            </div>

            {/* Date Filter */}
            <div className="flex flex-wrap gap-4 mb-6 items-center">
                <div className="flex gap-2 items-center">
                    <label className="text-sm text-gray-600">Dari:</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-xl text-gray-800"
                    />
                </div>
                <div className="flex gap-2 items-center">
                    <label className="text-sm text-gray-600">Sampai:</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-xl text-gray-800"
                    />
                </div>
                <button
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                    className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-xl text-sm"
                >
                    Reset Filter
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                </div>
            ) : logs.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada log</h3>
                    <p className="text-gray-500">Tidak ada perubahan transaksi yang tercatat</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {logs.map((log) => {
                        const oldValues = parseOldValues(log.old_values);
                        return (
                            <div key={log.id} className="bg-white rounded-xl border border-gray-200 p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-3">
                                        {getActionBadge(log.action)}
                                        <span className="font-mono text-sm text-gray-600">
                                            {log.transaction?.invoice_number || log.transaction_id.slice(0, 8)}
                                        </span>
                                    </div>
                                    <span className="text-sm text-gray-500">{formatDate(log.created_at)}</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Alasan</p>
                                        <p className="text-gray-800">{log.reason}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Dilakukan oleh</p>
                                        <p className="text-gray-800">
                                            {log.user?.name || 'Unknown'}
                                            <span className="text-xs text-gray-500 ml-1">({log.user?.role})</span>
                                        </p>
                                    </div>
                                </div>

                                {oldValues && (
                                    <div className="bg-gray-50 rounded-lg p-3 mt-2">
                                        <p className="text-xs text-gray-500 mb-2">Nilai sebelum perubahan</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                                            <div>
                                                <span className="text-gray-500">Total:</span>
                                                <span className="ml-1 font-medium text-gray-800">{formatPrice(oldValues.total || 0)}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Subtotal:</span>
                                                <span className="ml-1 text-gray-800">{formatPrice(oldValues.subtotal || 0)}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Diskon:</span>
                                                <span className="ml-1 text-gray-800">{formatPrice(oldValues.discount || 0)}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Pajak:</span>
                                                <span className="ml-1 text-gray-800">{formatPrice(oldValues.tax || 0)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="text-xs text-gray-400 mt-2">
                                    IP: {log.ip_address || 'N/A'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </AppLayout>
    );
}
