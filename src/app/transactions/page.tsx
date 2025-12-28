'use client';

import AppLayout from '@/components/AppLayout';

export default function TransactionsPage() {
    return (
        <AppLayout>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Riwayat Transaksi</h1>
                    <p className="text-gray-500">Lihat semua transaksi penjualan</p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="date"
                        className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                    />
                    <button className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50">
                        Filter
                    </button>
                </div>
            </div>

            {/* Empty State */}
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
        </AppLayout>
    );
}
