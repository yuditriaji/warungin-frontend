'use client';

import AppLayout from '@/components/AppLayout';

export default function DashboardPage() {
    return (
        <AppLayout>
            {/* Welcome Card */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white mb-8">
                <h1 className="text-2xl font-bold mb-2">Selamat Datang! 👋</h1>
                <p className="text-purple-100">
                    Kelola bisnis Anda dengan mudah menggunakan Warungin
                </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <QuickActionCard
                    icon="🛒"
                    title="Transaksi Baru"
                    description="Buat penjualan baru"
                    href="/pos"
                    color="bg-green-50 text-green-600 border-green-200"
                />
                <QuickActionCard
                    icon="📦"
                    title="Produk"
                    description="Kelola produk"
                    href="/products"
                    color="bg-blue-50 text-blue-600 border-blue-200"
                />
                <QuickActionCard
                    icon="📊"
                    title="Laporan"
                    description="Lihat penjualan"
                    href="/reports"
                    color="bg-purple-50 text-purple-600 border-purple-200"
                />
                <QuickActionCard
                    icon="⚙️"
                    title="Pengaturan"
                    description="Konfigurasi"
                    href="/settings"
                    color="bg-gray-50 text-gray-600 border-gray-200"
                />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Penjualan Hari Ini"
                    value="Rp 0"
                    change="+0%"
                    icon="💰"
                />
                <StatCard
                    title="Transaksi"
                    value="0"
                    change="+0"
                    icon="📋"
                />
                <StatCard
                    title="Produk Terjual"
                    value="0"
                    change="+0"
                    icon="📦"
                />
            </div>

            {/* Coming Soon Notice */}
            <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                <p className="text-yellow-800">
                    🚧 Dashboard sedang dalam pengembangan. Fitur lengkap akan segera hadir!
                </p>
            </div>
        </AppLayout>
    );
}

function QuickActionCard({
    icon,
    title,
    description,
    href,
    color
}: {
    icon: string;
    title: string;
    description: string;
    href: string;
    color: string;
}) {
    return (
        <a
            href={href}
            className={`block p-6 rounded-xl border-2 hover:shadow-md transition-shadow ${color}`}
        >
            <span className="text-3xl mb-3 block">{icon}</span>
            <h3 className="font-semibold mb-1">{title}</h3>
            <p className="text-sm opacity-75">{description}</p>
        </a>
    );
}

function StatCard({
    title,
    value,
    change,
    icon
}: {
    title: string;
    value: string;
    change: string;
    icon: string;
}) {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-4">
                <span className="text-2xl">{icon}</span>
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    {change}
                </span>
            </div>
            <h3 className="text-sm text-gray-500 mb-1">{title}</h3>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    );
}
