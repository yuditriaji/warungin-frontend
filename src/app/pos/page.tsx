'use client';

import AppLayout from '@/components/AppLayout';

export default function POSPage() {
    return (
        <AppLayout>
            <div className="h-full flex gap-6">
                {/* Product Grid */}
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-xl font-bold text-gray-900">Kasir</h1>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Cari produk..."
                                className="w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Empty Product Grid */}
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada produk</h3>
                        <p className="text-gray-500 mb-4">Tambahkan produk di halaman Produk terlebih dahulu</p>
                        <a href="/products" className="text-purple-600 hover:underline">
                            Ke halaman Produk →
                        </a>
                    </div>
                </div>

                {/* Cart Sidebar */}
                <div className="w-80 bg-white rounded-xl border border-gray-200 p-4 flex flex-col">
                    <h2 className="font-semibold text-gray-900 mb-4">Keranjang</h2>

                    {/* Empty Cart */}
                    <div className="flex-1 flex items-center justify-center text-center">
                        <div>
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <p className="text-gray-500 text-sm">Keranjang kosong</p>
                        </div>
                    </div>

                    {/* Cart Footer */}
                    <div className="border-t border-gray-100 pt-4 mt-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-600">Total</span>
                            <span className="text-xl font-bold text-gray-900">Rp 0</span>
                        </div>
                        <button
                            disabled
                            className="w-full py-3 bg-gray-200 text-gray-500 rounded-xl font-semibold cursor-not-allowed"
                        >
                            Bayar
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
