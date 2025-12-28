'use client';

import AppLayout from '@/components/AppLayout';

export default function ReportsPage() {
    return (
        <AppLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Laporan</h1>
                <p className="text-gray-500">Analisis penjualan dan bisnis Anda</p>
            </div>

            {/* Date Range */}
            <div className="flex gap-4 mb-6">
                <select className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500">
                    <option>Hari Ini</option>
                    <option>7 Hari Terakhir</option>
                    <option>30 Hari Terakhir</option>
                    <option>Bulan Ini</option>
                </select>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Total Penjualan</p>
                    <p className="text-2xl font-bold text-gray-900">Rp 0</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Transaksi</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Produk Terjual</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Rata-rata per Transaksi</p>
                    <p className="text-2xl font-bold text-gray-900">Rp 0</p>
                </div>
            </div>

            {/* Chart Placeholder */}
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada data</h3>
                <p className="text-gray-500">Grafik akan muncul setelah ada transaksi</p>
            </div>
        </AppLayout>
    );
}
