'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { DashboardStats, TopProduct, Transaction, getDashboardStats, getTopProducts, getRecentTransactions } from '@/lib/api';

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [recentTx, setRecentTx] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        setLoading(true);
        const [statsData, productsData, txData] = await Promise.all([
            getDashboardStats(),
            getTopProducts(),
            getRecentTransactions(),
        ]);
        setStats(statsData);
        setTopProducts(productsData);
        setRecentTx(txData);
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
            hour: '2-digit',
            minute: '2-digit',
        });
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
            {/* Welcome Card */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white mb-8">
                <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
                <p className="text-purple-100">Analitik bisnis Anda dalam satu pandangan</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    title="Penjualan Hari Ini"
                    value={formatPrice(stats?.today_sales || 0)}
                    subtitle={`${stats?.today_transactions || 0} transaksi`}
                    icon="💰"
                    color="bg-green-50 border-green-200"
                />
                <StatCard
                    title="Penjualan Minggu Ini"
                    value={formatPrice(stats?.week_sales || 0)}
                    subtitle={`${stats?.week_transactions || 0} transaksi`}
                    icon="📈"
                    color="bg-blue-50 border-blue-200"
                />
                <StatCard
                    title="Penjualan Bulan Ini"
                    value={formatPrice(stats?.month_sales || 0)}
                    subtitle={`${stats?.month_transactions || 0} transaksi`}
                    icon="📊"
                    color="bg-purple-50 border-purple-200"
                />
                <StatCard
                    title="Produk"
                    value={String(stats?.total_products || 0)}
                    subtitle={`${stats?.low_stock_products || 0} stok rendah`}
                    icon="📦"
                    color="bg-orange-50 border-orange-200"
                />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Produk Terlaris Bulan Ini</h2>
                    {topProducts.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">Belum ada data penjualan</p>
                    ) : (
                        <div className="space-y-3">
                            {topProducts.map((product, idx) => (
                                <div key={product.product_id} className="flex items-center gap-4">
                                    <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                                        {idx + 1}
                                    </span>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{product.product_name}</p>
                                        <p className="text-sm text-gray-500">{product.total_qty} terjual</p>
                                    </div>
                                    <span className="font-semibold text-gray-900">{formatPrice(product.total_sales)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Transactions */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Transaksi Terakhir</h2>
                    {recentTx.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">Belum ada transaksi</p>
                    ) : (
                        <div className="space-y-3">
                            {recentTx.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-mono text-sm text-gray-600">{tx.invoice_number}</p>
                                        <p className="text-xs text-gray-400">{formatDate(tx.created_at)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">{formatPrice(tx.total)}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${tx.payment_method === 'cash'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-purple-100 text-purple-700'
                                            }`}>
                                            {tx.payment_method === 'cash' ? 'Tunai' : tx.payment_method.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <a href="/pos" className="p-4 bg-green-50 border border-green-200 rounded-xl text-center hover:shadow-md transition-shadow">
                    <span className="text-2xl block mb-2">🛒</span>
                    <span className="text-sm font-medium text-green-700">Transaksi Baru</span>
                </a>
                <a href="/products" className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-center hover:shadow-md transition-shadow">
                    <span className="text-2xl block mb-2">📦</span>
                    <span className="text-sm font-medium text-blue-700">Kelola Produk</span>
                </a>
                <a href="/transactions" className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-center hover:shadow-md transition-shadow">
                    <span className="text-2xl block mb-2">📋</span>
                    <span className="text-sm font-medium text-purple-700">Riwayat</span>
                </a>
                <a href="/reports" className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center hover:shadow-md transition-shadow">
                    <span className="text-2xl block mb-2">📊</span>
                    <span className="text-sm font-medium text-gray-700">Laporan</span>
                </a>
            </div>
        </AppLayout>
    );
}

function StatCard({
    title,
    value,
    subtitle,
    icon,
    color
}: {
    title: string;
    value: string;
    subtitle: string;
    icon: string;
    color: string;
}) {
    return (
        <div className={`rounded-xl border p-4 ${color}`}>
            <div className="flex justify-between items-start mb-2">
                <span className="text-2xl">{icon}</span>
            </div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
    );
}
