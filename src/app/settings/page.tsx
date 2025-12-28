'use client';

import AppLayout from '@/components/AppLayout';

export default function SettingsPage() {
    return (
        <AppLayout>
            <div className="max-w-4xl">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Pengaturan</h1>

                {/* Business Settings */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Bisnis</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bisnis</label>
                            <input
                                type="text"
                                placeholder="Warung Makan Barokah"
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Usaha</label>
                            <select className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500">
                                <option>Warung Makan</option>
                                <option>Toko Kelontong</option>
                                <option>Cafe</option>
                                <option>Lainnya</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                            <input
                                type="tel"
                                placeholder="08123456789"
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                            <input
                                type="text"
                                placeholder="Jl. Merdeka No. 1"
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>
                    <button className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors">
                        Simpan Perubahan
                    </button>
                </div>

                {/* Subscription */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Langganan</h2>
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                        <div>
                            <p className="font-semibold text-purple-900">Paket Gratis</p>
                            <p className="text-sm text-purple-600">20 transaksi / hari • 20 produk</p>
                        </div>
                        <button className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors">
                            Upgrade
                        </button>
                    </div>
                </div>

                {/* Account */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Akun</h2>
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-purple-600 font-bold text-lg">U</span>
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-gray-900">User</p>
                            <p className="text-sm text-gray-500">user@example.com</p>
                        </div>
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                            Owner
                        </span>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
