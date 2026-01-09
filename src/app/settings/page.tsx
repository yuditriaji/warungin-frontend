'use client';

import { useEffect, useState, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { PlanInfo, SubscriptionUsage, TenantSettings, getPlans, getSubscription, getUsage, upgradePlan, getTenantSettings, updateTenantSettings, uploadQRISImage, createSubscriptionInvoice, getCurrentUser } from '@/lib/api';

export default function SettingsPage() {
    const [plans, setPlans] = useState<PlanInfo[]>([]);
    const [currentPlan, setCurrentPlan] = useState<string>('gratis');
    const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState(false);

    // QRIS Settings state
    const [qrisSettings, setQrisSettings] = useState<TenantSettings>({
        qris_enabled: false,
        qris_image_url: '',
        qris_label: ''
    });
    const [savingQris, setSavingQris] = useState(false);
    const [uploadingQris, setUploadingQris] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [plansData, subscriptionData, usageData, tenantSettingsData] = await Promise.all([
            getPlans(),
            getSubscription(),
            getUsage(),
            getTenantSettings(),
        ]);
        setPlans(plansData);
        if (subscriptionData) {
            setCurrentPlan(subscriptionData.subscription.plan);
        }
        setUsage(usageData);
        setQrisSettings(tenantSettingsData);
        setLoading(false);
    };

    const handleSaveQrisSettings = async () => {
        setSavingQris(true);
        await updateTenantSettings(qrisSettings);
        setSavingQris(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (max 500KB)
        if (file.size > 500 * 1024) {
            alert('File terlalu besar. Maksimal 500KB.');
            return;
        }

        setUploadingQris(true);
        const result = await uploadQRISImage(file);
        if (result) {
            setQrisSettings(result);
        } else {
            alert('Gagal mengupload gambar QRIS');
        }
        setUploadingQris(false);
    };

    const handleUpgrade = async (planId: string) => {
        if (planId === currentPlan) return;

        // Get plan info
        const targetPlan = plans.find(p => p.id === planId);
        if (!targetPlan) return;

        // If it's a free plan or downgrade, just upgrade directly
        if (targetPlan.price === 0) {
            if (!confirm(`Pindah ke paket ${planId}? Fitur premium akan dinonaktifkan.`)) return;
            setUpgrading(true);
            const success = await upgradePlan(planId);
            if (success) {
                loadData();
            }
            setUpgrading(false);
            return;
        }

        // For paid plans, create an invoice and redirect to payment
        const confirmMsg = `Upgrade ke paket ${targetPlan.name} seharga ${formatPrice(targetPlan.price)}?\n\nAnda akan diarahkan ke halaman pembayaran.`;
        if (!confirm(confirmMsg)) return;

        setUpgrading(true);

        // Get user email
        const userData = await getCurrentUser();
        if (!userData) {
            alert('Gagal mendapatkan informasi user');
            setUpgrading(false);
            return;
        }

        // Create invoice
        const invoice = await createSubscriptionInvoice(planId, userData.user.email);
        if (invoice && invoice.invoice_url) {
            // Redirect to Xendit payment page
            window.location.href = invoice.invoice_url;
        } else {
            alert('Gagal membuat invoice pembayaran. Silakan coba lagi.');
            setUpgrading(false);
        }
    };

    const formatPrice = (price: number) => {
        if (price === 0) return 'Gratis';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(price) + '/bulan';
    };

    const getUsagePercent = (used: number, max: number) => {
        if (max === 0) return 0; // unlimited
        return Math.min(100, (used / max) * 100);
    };

    const getUsageColor = (percent: number) => {
        if (percent >= 90) return 'bg-red-500';
        if (percent >= 70) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    return (
        <AppLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
                <p className="text-gray-500">Kelola langganan dan penggunaan</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                </div>
            ) : (
                <>
                    {/* Usage Section */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                        <h2 className="font-semibold text-gray-900 mb-4">Penggunaan</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Users */}
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600">Pengguna</span>
                                    <span className="text-gray-900">{usage?.users || 0} / {usage?.max_users === 0 ? '∞' : usage?.max_users}</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${getUsageColor(getUsagePercent(usage?.users || 0, usage?.max_users || 1))}`}
                                        style={{ width: `${getUsagePercent(usage?.users || 0, usage?.max_users || 1)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Products */}
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600">Produk</span>
                                    <span className="text-gray-900">{usage?.products || 0} / {usage?.max_products === 0 ? '∞' : usage?.max_products}</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${getUsageColor(getUsagePercent(usage?.products || 0, usage?.max_products || 1))}`}
                                        style={{ width: `${getUsagePercent(usage?.products || 0, usage?.max_products || 1)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Transactions Today */}
                            {(usage?.max_transactions_daily || 0) > 0 && (
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">Transaksi Hari Ini</span>
                                        <span className="text-gray-900">{usage?.transactions_today || 0} / {usage?.max_transactions_daily}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${getUsageColor(getUsagePercent(usage?.transactions_today || 0, usage?.max_transactions_daily || 1))}`}
                                            style={{ width: `${getUsagePercent(usage?.transactions_today || 0, usage?.max_transactions_daily || 1)}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Outlets */}
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600">Outlet</span>
                                    <span className="text-gray-900">{usage?.outlets || 0} / {usage?.max_outlets === 0 ? '∞' : usage?.max_outlets}</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${getUsageColor(getUsagePercent(usage?.outlets || 0, usage?.max_outlets || 1))}`}
                                        style={{ width: `${getUsagePercent(usage?.outlets || 0, usage?.max_outlets || 1)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* QRIS Settings Section */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                        <h2 className="font-semibold text-gray-900 mb-4">Pengaturan QRIS</h2>
                        <p className="text-sm text-gray-500 mb-4">
                            Gunakan QRIS milik Anda sendiri untuk menerima pembayaran langsung ke rekening Anda.
                        </p>

                        <div className="space-y-4">
                            {/* Enable Toggle */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">Aktifkan QRIS</p>
                                    <p className="text-sm text-gray-500">Tampilkan opsi pembayaran QRIS di kasir</p>
                                </div>
                                <button
                                    onClick={() => setQrisSettings({ ...qrisSettings, qris_enabled: !qrisSettings.qris_enabled })}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${qrisSettings.qris_enabled ? 'bg-purple-600' : 'bg-gray-200'
                                        }`}
                                >
                                    <span
                                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${qrisSettings.qris_enabled ? 'left-7' : 'left-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            {qrisSettings.qris_enabled && (
                                <>
                                    {/* QRIS Image Upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Gambar QRIS
                                        </label>

                                        {/* Hidden file input */}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />

                                        {qrisSettings.qris_image_url ? (
                                            /* Show preview when image exists */
                                            <div className="flex items-start gap-4">
                                                <div className="w-32 h-32 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                                                    <img
                                                        src={qrisSettings.qris_image_url}
                                                        alt="QRIS Preview"
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <button
                                                        onClick={() => fileInputRef.current?.click()}
                                                        disabled={uploadingQris}
                                                        className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50"
                                                    >
                                                        {uploadingQris ? 'Mengupload...' : 'Ganti Gambar'}
                                                    </button>
                                                    <p className="text-xs text-gray-400">
                                                        Maks. 500KB
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Upload button when no image */
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploadingQris}
                                                className="w-full py-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-colors disabled:opacity-50"
                                            >
                                                <div className="flex flex-col items-center gap-2">
                                                    {uploadingQris ? (
                                                        <>
                                                            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                                                            <span className="text-sm text-gray-500">Mengupload...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                            <span className="text-sm text-gray-600 font-medium">Klik untuk upload gambar QRIS</span>
                                                            <span className="text-xs text-gray-400">PNG, JPG (Maks. 500KB)</span>
                                                        </>
                                                    )}
                                                </div>
                                            </button>
                                        )}
                                    </div>

                                    {/* QRIS Label */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Label QRIS
                                        </label>
                                        <input
                                            type="text"
                                            value={qrisSettings.qris_label}
                                            onChange={(e) => setQrisSettings({ ...qrisSettings, qris_label: e.target.value })}
                                            placeholder="BCA QRIS, DANA, GoPay, dll"
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Save Button */}
                            <button
                                onClick={handleSaveQrisSettings}
                                disabled={savingQris}
                                className="px-6 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {savingQris ? 'Menyimpan...' : 'Simpan Pengaturan QRIS'}
                            </button>
                        </div>
                    </div>

                    {/* Plans Section */}
                    <h2 className="font-semibold text-gray-900 mb-4">Pilih Paket</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`bg-white rounded-xl border-2 p-6 transition-all ${currentPlan === plan.id
                                    ? 'border-purple-500 ring-2 ring-purple-100'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="mb-4">
                                    {currentPlan === plan.id && (
                                        <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full mb-2">
                                            Paket Aktif
                                        </span>
                                    )}
                                    <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                                    <p className="text-2xl font-bold text-purple-600">{formatPrice(plan.price)}</p>
                                </div>

                                <ul className="space-y-2 mb-6">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                                            <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => handleUpgrade(plan.id)}
                                    disabled={currentPlan === plan.id || upgrading}
                                    className={`w-full py-2 rounded-xl font-medium transition-colors ${currentPlan === plan.id
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-purple-600 text-white hover:bg-purple-700'
                                        }`}
                                >
                                    {currentPlan === plan.id ? 'Paket Aktif' : 'Pilih Paket'}
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </AppLayout>
    );
}
