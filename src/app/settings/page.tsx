'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import QRISPaymentModal from '@/components/QRISPaymentModal';
import VAPaymentModal from '@/components/VAPaymentModal';
import CancelSubscriptionModal from '@/components/CancelSubscriptionModal';
import {
    PlanInfo, SubscriptionUsage, TenantSettings, ReferralStatus,
    QRISSubscriptionResponse, VASubscriptionResponse,
    BillingPeriod, VABankCode, VA_BANKS, PromoValidationResult,
    getPlans, getSubscription, getUsage, upgradePlan,
    getTenantSettings, updateTenantSettings, uploadQRISImage,
    createSubscriptionQRIS, createSubscriptionVA, getCurrentUser,
    reactivateSubscription, validatePromoCode,
    getReferralStatus, validateReferralCode, updateTenantProfile,
} from '@/lib/api';

// Separate component that uses useSearchParams
function SettingsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [plans, setPlans] = useState<PlanInfo[]>([]);
    const [currentPlan, setCurrentPlan] = useState<string>('gratis');
    const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState(false);
    const [paymentMessage, setPaymentMessage] = useState<string>('');
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<PlanInfo | null>(null);

    // Billing period state
    const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');

    // Payment method state
    const [paymentMethod, setPaymentMethod] = useState<'qris' | 'va'>('va');
    const [selectedBank, setSelectedBank] = useState<VABankCode>('mandiri');
    const [showMethodSheet, setShowMethodSheet] = useState(false);

    // QRIS modal state
    const [qrisData, setQrisData] = useState<QRISSubscriptionResponse | null>(null);
    const [showQRISModal, setShowQRISModal] = useState(false);

    // VA modal state
    const [vaData, setVaData] = useState<VASubscriptionResponse | null>(null);
    const [showVAModal, setShowVAModal] = useState(false);

    // Cancel subscription state
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [subscriptionData, setSubscriptionData] = useState<{
        is_cancelled: boolean;
        cancelled_at: string | null;
        current_period_end: string;
        billing_period: string;
        auto_renew: boolean;
    } | null>(null);

    // Promo code state
    const [promoCode, setPromoCode] = useState('');
    const [promoResult, setPromoResult] = useState<PromoValidationResult | null>(null);
    const [promoLoading, setPromoLoading] = useState(false);
    const [promoError, setPromoError] = useState('');

    // QRIS Settings state
    const [qrisSettings, setQrisSettings] = useState<TenantSettings>({
        qris_enabled: false,
        qris_image_url: '',
        qris_label: '',
        tax_enabled: false,
        tax_rate: 11,
        tax_label: '',
        service_charge_enabled: false,
        service_charge_rate: 10,
        service_charge_label: '',
        raw_material_enabled: true,
        stock_enabled: true,
    });
    const [savingQris, setSavingQris] = useState(false);
    const [uploadingQris, setUploadingQris] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Referral code state
    const [referralStatus, setReferralStatus] = useState<ReferralStatus>({ has_referral: false, referral_code: '', affiliator_name: '' });
    const [referralInput, setReferralInput] = useState('');
    const [referralValidating, setReferralValidating] = useState(false);
    const [referralValidResult, setReferralValidResult] = useState<{ valid: boolean; name?: string } | null>(null);
    const [referralSaving, setReferralSaving] = useState(false);
    const [referralMessage, setReferralMessage] = useState('');

    useEffect(() => {
        loadData();

        // Check for payment return status
        const paymentStatus = searchParams.get('payment');
        if (paymentStatus === 'success') {
            setPaymentMessage('✅ Pembayaran berhasil! Paket Anda telah diaktifkan.');
            router.replace('/settings', { scroll: false });
        } else if (paymentStatus === 'failed') {
            setPaymentMessage('❌ Pembayaran dibatalkan atau gagal. Silakan coba lagi.');
            router.replace('/settings', { scroll: false });
        }
    }, [searchParams, router]);

    const loadData = async () => {
        setLoading(true);
        const [plansData, subData, usageData, tenantSettingsData, referralData] = await Promise.all([
            getPlans(),
            getSubscription(),
            getUsage(),
            getTenantSettings(),
            getReferralStatus(),
        ]);
        setPlans(plansData);
        if (subData) {
            setCurrentPlan(subData.subscription.plan);
            setSubscriptionData({
                is_cancelled: subData.is_cancelled || false,
                cancelled_at: subData.cancelled_at || null,
                current_period_end: subData.current_period_end || '',
                billing_period: subData.billing_period || 'monthly',
                auto_renew: subData.auto_renew !== false,
            });
        }
        setUsage(usageData);
        setQrisSettings(tenantSettingsData);
        setReferralStatus(referralData);
        setLoading(false);
    };

    const handleSaveQrisSettings = async () => {
        if (qrisSettings.qris_enabled && !qrisSettings.qris_image_url) {
            alert('Silakan upload gambar QRIS sebelum menyimpan konfigurasi.');
            return;
        }

        setSavingQris(true);
        await updateTenantSettings(qrisSettings);
        setSavingQris(false);
        window.location.reload();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

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

        const targetPlan = plans.find(p => p.id === planId);
        if (!targetPlan) return;

        setSelectedPlan(targetPlan);
        setShowUpgradeModal(true);
    };

    const resetPromo = () => {
        setPromoCode('');
        setPromoResult(null);
        setPromoError('');
    };

    const handleValidatePromo = async () => {
        if (!promoCode.trim() || !selectedPlan) return;
        setPromoLoading(true);
        setPromoError('');
        setPromoResult(null);
        try {
            const result = await validatePromoCode(promoCode.trim(), selectedPlan.id, billingPeriod);
            setPromoResult(result);
        } catch (err: any) {
            setPromoError(err.message || 'Kode promo tidak valid');
        } finally {
            setPromoLoading(false);
        }
    };

    const confirmUpgrade = async () => {
        if (!selectedPlan) return;

        setShowUpgradeModal(false);

        // For free plans (downgrade), just switch directly
        if (selectedPlan.price === 0) {
            setUpgrading(true);
            const success = await upgradePlan(selectedPlan.id);
            if (success) {
                setPaymentMessage(`✅ Berhasil pindah ke paket ${selectedPlan.name}!`);
                loadData();
            } else {
                setPaymentMessage('❌ Gagal mengubah paket. Silakan coba lagi.');
            }
            setUpgrading(false);
            resetPromo();
            return;
        }

        // For paid plans, generate payment
        setUpgrading(true);

        const userData = await getCurrentUser();
        const email = userData?.user?.email || '';

        if (!email) {
            setPaymentMessage('❌ Email tidak ditemukan. Silakan login ulang.');
            setUpgrading(false);
            return;
        }

        const validPromo = promoResult?.valid ? promoCode.trim() : undefined;

        if (paymentMethod === 'va') {
            // Generate VA
            const va = await createSubscriptionVA(selectedPlan.id, billingPeriod, email, selectedBank, validPromo);
            if (va) {
                setVaData(va);
                setShowVAModal(true);
            } else {
                setPaymentMessage('❌ Gagal membuat Virtual Account. Silakan coba lagi.');
            }
        } else {
            // Generate QRIS
            const qris = await createSubscriptionQRIS(selectedPlan.id, billingPeriod, email);
            if (qris) {
                setQrisData(qris);
                setShowQRISModal(true);
            } else {
                setPaymentMessage('❌ Gagal membuat QRIS. Silakan coba lagi.');
            }
        }
        setUpgrading(false);
        resetPromo();
    };

    const handleQRISSuccess = () => {
        setShowQRISModal(false);
        setQrisData(null);
        setPaymentMessage('✅ Pembayaran berhasil! Paket Anda telah diaktifkan.');
        loadData();
    };

    const handleVASuccess = () => {
        setShowVAModal(false);
        setVaData(null);
        setPaymentMessage('✅ Pembayaran berhasil! Paket Anda telah diaktifkan.');
        loadData();
    };

    const handleReactivate = async () => {
        const result = await reactivateSubscription();
        if (result) {
            setPaymentMessage('✅ Langganan diaktifkan kembali!');
            loadData();
        } else {
            setPaymentMessage('❌ Gagal mengaktifkan kembali. Silakan coba lagi.');
        }
    };

    const handleCancelConfirmed = () => {
        setShowCancelModal(false);
        setPaymentMessage('ℹ️ Langganan akan berakhir di akhir periode. Anda tetap memiliki akses penuh hingga saat itu.');
        loadData();
    };

    const getPlanPrice = (plan: PlanInfo): number => {
        switch (billingPeriod) {
            case 'quarterly':
                return plan.price_quarterly || plan.price * 3;
            case 'yearly':
                return plan.price_yearly || plan.price * 12;
            default:
                return plan.price_monthly || plan.price;
        }
    };

    const getMonthlyEquivalent = (plan: PlanInfo): number => {
        const price = getPlanPrice(plan);
        switch (billingPeriod) {
            case 'quarterly':
                return price / 3;
            case 'yearly':
                return price / 12;
            default:
                return price;
        }
    };

    const getSavingsPercent = (plan: PlanInfo): number => {
        if (plan.price === 0) return 0;
        const monthlyTotal = plan.price;
        const equivalent = getMonthlyEquivalent(plan);
        if (monthlyTotal === 0) return 0;
        return Math.round(((monthlyTotal - equivalent) / monthlyTotal) * 100);
    };

    const formatPrice = (price: number) => {
        if (price === 0) return 'Gratis';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const formatPricePerMonth = (price: number) => {
        if (price === 0) return 'Gratis';
        return formatPrice(price) + '/bulan';
    };

    const periodLabel = (period: BillingPeriod) => {
        const labels: Record<BillingPeriod, string> = {
            monthly: '/bulan',
            quarterly: '/3 bulan',
            yearly: '/tahun',
        };
        return labels[period];
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const getUsagePercent = (used: number, max: number) => {
        if (max === 0) return 0;
        return Math.min(100, (used / max) * 100);
    };

    const getUsageColor = (percent: number) => {
        if (percent >= 90) return 'bg-red-500';
        if (percent >= 70) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    return (
        <AppLayout>
            {/* Main title moved inside combined card */}

            {/* Payment Status Message */}
            {paymentMessage && (
                <div className={`mb-6 p-4 rounded-xl border ${paymentMessage.includes('✅') ? 'bg-green-50 border-green-200 text-green-800' : paymentMessage.includes('ℹ️') ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    <div className="flex justify-between items-center">
                        <span className="font-medium">{paymentMessage}</span>
                        <button
                            onClick={() => setPaymentMessage('')}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                </div>
            ) : (
                <>
                    {/* Status Langganan & Penggunaan */}
                    <div className="bg-white rounded-xl border border-gray-200 mb-6">
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-1">Status Langganan</h2>
                            <p className="text-gray-500 text-sm mb-6">Kelola langganan dan penggunaan</p>

                            {/* Active Plan Banner */}
                            {currentPlan !== 'gratis' && subscriptionData ? (
                                <div className={`mb-8 p-4 rounded-xl border flex items-center justify-between flex-wrap gap-4 ${subscriptionData.is_cancelled ? 'bg-orange-50 border-orange-200' : 'bg-purple-50 border-purple-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`px-2 py-1 text-xs font-semibold rounded-md ${subscriptionData.is_cancelled ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                            Paket Aktif
                                        </div>
                                        <div className="font-bold text-gray-900">
                                            {plans.find(p => p.id === currentPlan)?.name || 'Pemula'}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-sm text-gray-600">
                                            {subscriptionData.is_cancelled
                                                ? `Berakhir pada ${formatDate(subscriptionData.current_period_end)}`
                                                : `Berlaku hingga ${formatDate(subscriptionData.current_period_end)}`
                                            }
                                        </div>
                                        {subscriptionData.is_cancelled ? (
                                            <button
                                                onClick={handleReactivate}
                                                className="px-4 py-2 border border-green-300 text-green-600 bg-white rounded-xl text-sm font-medium hover:bg-green-50"
                                            >
                                                Aktifkan Kembali
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setShowCancelModal(true)}
                                                className="px-4 py-2 border border-red-200 text-red-600 bg-white rounded-xl text-sm font-medium hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm"
                                            >
                                                Batalkan Langganan
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-8 p-4 rounded-xl border bg-gray-50 border-gray-200 flex items-center justify-between flex-wrap gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="px-2 py-1 text-xs font-semibold rounded-md bg-gray-200 text-gray-700">
                                            Paket Aktif
                                        </div>
                                        <div className="font-bold text-gray-900">
                                            Gratis
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Akses terbatas. Upgrade untuk fitur lengkap.
                                    </div>
                                </div>
                            )}

                            {/* Usage Progress */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Users */}
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="font-bold text-gray-900">Pengguna</span>
                                        <span className="text-sm font-semibold text-gray-900">{usage?.users || 0} / {usage?.max_users === 0 ? '∞' : usage?.max_users}</span>
                                    </div>
                                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${getUsageColor(getUsagePercent(usage?.users || 0, usage?.max_users || 1))}`}
                                            style={{ width: `${getUsagePercent(usage?.users || 0, usage?.max_users || 1)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Products */}
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="font-bold text-gray-900">Produk</span>
                                        <span className="text-sm font-semibold text-gray-900">{usage?.products || 0} / {usage?.max_products === 0 ? '∞' : usage?.max_products}</span>
                                    </div>
                                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${getUsageColor(getUsagePercent(usage?.products || 0, usage?.max_products || 1))}`}
                                            style={{ width: `${getUsagePercent(usage?.products || 0, usage?.max_products || 1)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Outlets */}
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="font-bold text-gray-900">Outlet</span>
                                        <span className="text-sm font-semibold text-gray-900">{usage?.outlets || 0} / {usage?.max_outlets === 0 ? '∞' : usage?.max_outlets}</span>
                                    </div>
                                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${getUsageColor(getUsagePercent(usage?.outlets || 0, usage?.max_outlets || 1))}`}
                                            style={{ width: `${getUsagePercent(usage?.outlets || 0, usage?.max_outlets || 1)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Konfigurasi Fitur */}
                    <div className="mb-4 mt-2">
                        <h2 className="text-xl font-bold text-gray-900">Konfigurasi Fitur</h2>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            {/* QRIS */}
                            <div className="bg-gray-50/50 rounded-xl border border-gray-200 p-5 flex flex-col transition-all">
                                <div className="flex justify-between items-start gap-4 mb-2">
                                    <h3 className="font-bold text-gray-900 text-base">QRIS</h3>
                                    <button
                                        onClick={() => setQrisSettings({ ...qrisSettings, qris_enabled: !qrisSettings.qris_enabled })}
                                        className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${qrisSettings.qris_enabled ? 'bg-purple-600' : 'bg-gray-200'}`}
                                    >
                                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${qrisSettings.qris_enabled ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed mb-4 flex-grow">
                                    Aktifkan QRIS milik Anda untuk menerima pembayaran langsung ke rekening Anda.
                                </p>

                                {qrisSettings.qris_enabled && (
                                    <div className="mt-1 pt-4 border-t border-gray-200 space-y-4">
                                        {/* QRIS Image Upload */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-2">Gambar QRIS</label>
                                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                                            {qrisSettings.qris_image_url ? (
                                                <div className="flex items-start gap-3">
                                                    <div className="w-20 h-20 bg-white rounded-lg overflow-hidden border border-gray-200 shrink-0">
                                                        <img src={qrisSettings.qris_image_url} alt="QRIS" className="w-full h-full object-contain" />
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <button onClick={() => fileInputRef.current?.click()} disabled={uploadingQris} className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors">Ganti Foto</button>
                                                        <p className="text-[10px] text-gray-500">Maks. 500KB</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button onClick={() => fileInputRef.current?.click()} disabled={uploadingQris} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg bg-white hover:border-purple-400 hover:bg-purple-50 transition-colors">
                                                    <div className="flex flex-col items-center gap-1">
                                                        {uploadingQris ? <span className="text-xs text-gray-500">Mengupload...</span> : <span className="text-xs font-medium text-gray-600">Upload QRIS (Maks 500KB)</span>}
                                                    </div>
                                                </button>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Label QRIS</label>
                                            <input type="text" value={qrisSettings.qris_label} onChange={(e) => setQrisSettings({ ...qrisSettings, qris_label: e.target.value })} placeholder="BCA QRIS..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* PPN */}
                            <div className="bg-gray-50/50 rounded-xl border border-gray-200 p-5 flex flex-col transition-all">
                                <div className="flex justify-between items-start gap-4 mb-2">
                                    <h3 className="font-bold text-gray-900 text-base">PPN/Pajak</h3>
                                    <button
                                        onClick={() => setQrisSettings({ ...qrisSettings, tax_enabled: !qrisSettings.tax_enabled })}
                                        className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${qrisSettings.tax_enabled ? 'bg-purple-600' : 'bg-gray-200'}`}
                                    >
                                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${qrisSettings.tax_enabled ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed mb-4 flex-grow">
                                    Aktifkan PPN otomatis ke semua transaksi. Pas untuk PKP (Pengusaha Kena Pajak).
                                </p>

                                {qrisSettings.tax_enabled && (
                                    <div className="mt-1 pt-4 border-t border-gray-200 space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Tarif (%)</label>
                                            <input type="number" min="0" step="0.1" value={qrisSettings.tax_rate || 11} onChange={(e) => setQrisSettings({ ...qrisSettings, tax_rate: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Label</label>
                                            <input type="text" value={qrisSettings.tax_label || ''} onChange={(e) => setQrisSettings({ ...qrisSettings, tax_label: e.target.value })} placeholder="PPN 11%" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Service Charge */}
                            <div className="bg-gray-50/50 rounded-xl border border-gray-200 p-5 flex flex-col transition-all">
                                <div className="flex justify-between items-start gap-4 mb-2">
                                    <h3 className="font-bold text-gray-900 text-base">Service Charge</h3>
                                    <button
                                        onClick={() => setQrisSettings({ ...qrisSettings, service_charge_enabled: !qrisSettings.service_charge_enabled })}
                                        className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${qrisSettings.service_charge_enabled ? 'bg-purple-600' : 'bg-gray-200'}`}
                                    >
                                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${qrisSettings.service_charge_enabled ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed mb-4 flex-grow">
                                    Aktifkan service charge untuk menambah biaya layanan ke setiap transaksi (Resto/Kafe).
                                </p>

                                {qrisSettings.service_charge_enabled && (
                                    <div className="mt-1 pt-4 border-t border-gray-200 space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Tarif (%)</label>
                                            <input type="number" min="0" step="0.5" value={qrisSettings.service_charge_rate || 10} onChange={(e) => setQrisSettings({ ...qrisSettings, service_charge_rate: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Label</label>
                                            <input type="text" value={qrisSettings.service_charge_label || ''} onChange={(e) => setQrisSettings({ ...qrisSettings, service_charge_label: e.target.value })} placeholder="Service 10%" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Bahan Baku */}
                            <div className="bg-gray-50/50 rounded-xl border border-gray-200 p-5 flex flex-col transition-all">
                                <div className="flex justify-between items-start gap-4 mb-2">
                                    <h3 className="font-bold text-gray-900 text-base">Bahan Baku</h3>
                                    <button
                                        onClick={() => setQrisSettings({ ...qrisSettings, raw_material_enabled: !qrisSettings.raw_material_enabled })}
                                        className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${qrisSettings.raw_material_enabled ? 'bg-purple-600' : 'bg-gray-200'}`}
                                    >
                                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${qrisSettings.raw_material_enabled ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed mb-0 flex-grow">
                                    Aktifkan pencatatan bahan baku untuk melacak stok bahan, resep, dan biaya produk.
                                </p>
                            </div>

                            {/* Stok Produk */}
                            <div className="bg-gray-50/50 rounded-xl border border-gray-200 p-5 flex flex-col transition-all">
                                <div className="flex justify-between items-start gap-4 mb-2">
                                    <h3 className="font-bold text-gray-900 text-base">Stok Produk</h3>
                                    <button
                                        onClick={() => setQrisSettings({ ...qrisSettings, stock_enabled: !qrisSettings.stock_enabled })}
                                        className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${qrisSettings.stock_enabled ? 'bg-purple-600' : 'bg-gray-200'}`}
                                    >
                                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${qrisSettings.stock_enabled ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed mb-0 flex-grow">
                                    Aktifkan pencatatan dan manajemen stok produk untuk memantau ketersediaan dan nilai inventori.
                                </p>
                            </div>
                        </div>

                        {/* Save Button for Konfigurasi Fitur */}
                        <div className="flex justify-end pt-4 border-t border-gray-200">
                            <button
                                onClick={handleSaveQrisSettings}
                                disabled={savingQris}
                                className="px-6 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                {savingQris ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                            </button>
                        </div>
                    </div>

                    {/* Referral Code Section */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-1">Kode Referral</h2>
                        <p className="text-sm text-gray-500 mb-6">Masukkan kode referral dari affiliator untuk memberikan keuntungan pada pengguna.</p>

                        {referralStatus.has_referral ? (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="font-medium text-green-800">Terhubung dengan Affiliator</div>
                                        <div className="text-sm text-green-600">
                                            Kode: <span className="font-mono font-bold">{referralStatus.referral_code}</span>
                                            {referralStatus.affiliator_name && ` — ${referralStatus.affiliator_name}`}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={referralInput}
                                        onChange={(e) => {
                                            setReferralInput(e.target.value.toUpperCase());
                                            setReferralValidResult(null);
                                            setReferralMessage('');
                                        }}
                                        placeholder="Masukkan kode referral"
                                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono tracking-wider uppercase text-gray-900"
                                        maxLength={10}
                                    />
                                    <button
                                        onClick={async () => {
                                            if (!referralInput.trim()) return;
                                            setReferralValidating(true);
                                            setReferralMessage('');
                                            const result = await validateReferralCode(referralInput.trim());
                                            setReferralValidResult({ valid: result.valid, name: result.data?.name });
                                            setReferralValidating(false);
                                        }}
                                        disabled={!referralInput.trim() || referralValidating}
                                        className="px-6 py-3 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-colors"
                                    >
                                        {referralValidating ? 'Cek...' : 'Validasi'}
                                    </button>
                                </div>

                                {referralValidResult && (
                                    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${referralValidResult.valid
                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                        : 'bg-red-50 text-red-600 border border-red-200'
                                        }`}>
                                        {referralValidResult.valid ? (
                                            <>
                                                <span>✅ Kode valid — Affiliator: <strong>{referralValidResult.name}</strong></span>
                                            </>
                                        ) : (
                                            <span>❌ Kode referral tidak valid atau tidak aktif</span>
                                        )}
                                    </div>
                                )}

                                {referralValidResult?.valid && (
                                    <button
                                        onClick={async () => {
                                            setReferralSaving(true);
                                            setReferralMessage('');
                                            const result = await updateTenantProfile({ referral_code: referralInput.trim() });
                                            if (result) {
                                                const newStatus = await getReferralStatus();
                                                setReferralStatus(newStatus);
                                                setReferralInput('');
                                                setReferralValidResult(null);
                                                setReferralMessage('✅ Kode referral berhasil diterapkan!');
                                            } else {
                                                setReferralMessage('❌ Gagal menyimpan kode referral');
                                            }
                                            setReferralSaving(false);
                                        }}
                                        disabled={referralSaving}
                                        className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                                    >
                                        {referralSaving ? 'Menyimpan...' : 'Terapkan Kode Referral'}
                                    </button>
                                )}

                                {referralMessage && (
                                    <div className={`text-sm px-4 py-3 rounded-xl border ${referralMessage.startsWith('✅') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                        {referralMessage}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Plans Section */}
                    <div className="mb-4 flex items-center justify-between flex-wrap gap-4">
                        <h2 className="font-semibold text-gray-900">Pilih Paket</h2>

                        {/* Billing Period Toggle */}
                        <div className="flex bg-gray-100 rounded-xl p-1">
                            {([
                                { value: 'monthly' as BillingPeriod, label: 'Bulanan' },
                                { value: 'quarterly' as BillingPeriod, label: '3 Bulan', badge: 'Hemat ~10%' },
                                { value: 'yearly' as BillingPeriod, label: 'Tahunan', badge: 'Hemat ~20%' },
                            ]).map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setBillingPeriod(option.value)}
                                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all ${billingPeriod === option.value
                                        ? 'bg-white text-purple-700 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    {option.label}
                                    {option.badge && billingPeriod === option.value && (
                                        <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                            {option.badge}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {plans.map((plan) => {
                            const price = getPlanPrice(plan);
                            const savings = getSavingsPercent(plan);

                            return (
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
                                        {plan.price === 0 ? (
                                            <p className="text-2xl font-bold text-purple-600">Gratis</p>
                                        ) : (
                                            <div>
                                                <p className="text-2xl font-bold text-purple-600">
                                                    {formatPrice(price)}
                                                    <span className="text-sm font-normal text-gray-500">{periodLabel(billingPeriod)}</span>
                                                </p>
                                                {billingPeriod !== 'monthly' && (
                                                    <p className="text-sm text-gray-500">
                                                        {formatPricePerMonth(getMonthlyEquivalent(plan))}
                                                        {savings > 0 && (
                                                            <span className="ml-1 text-green-600 font-medium">
                                                                (-{savings}%)
                                                            </span>
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <ul className="space-y-2 mb-6">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
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
                            );
                        })}
                    </div>
                </>
            )}

            {/* Upgrade Confirmation Modal */}
            {showUpgradeModal && selectedPlan && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            {selectedPlan.price === 0 ? 'Konfirmasi Pindah Paket' : 'Konfirmasi Upgrade'}
                        </h3>

                        {selectedPlan.price === 0 ? (
                            <p className="text-gray-700 mb-6">
                                Anda akan pindah ke paket <span className="font-semibold">{selectedPlan.name}</span>.
                                Fitur premium akan dinonaktifkan.
                            </p>
                        ) : (
                            <div className="mb-6">
                                <p className="text-gray-700 mb-4">
                                    Upgrade ke paket <span className="font-semibold text-purple-600">{selectedPlan.name}</span>
                                    {' '}({billingPeriod === 'quarterly' ? '3 Bulan' : billingPeriod === 'yearly' ? 'Tahunan' : 'Bulanan'})
                                </p>

                                {/* Price Breakdown */}
                                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                    <div className="flex justify-between text-gray-700">
                                        <span>Harga Paket</span>
                                        <span>{formatPrice(promoResult?.valid ? promoResult.base_price : getPlanPrice(selectedPlan))}</span>
                                    </div>
                                    {promoResult?.valid && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Diskon ({promoResult.discount_type === 'percentage' ? `${promoResult.discount_value}%` : formatPrice(promoResult.discount_value)})</span>
                                            <span>-{formatPrice(promoResult.discount_amount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-gray-700">
                                        <span>Biaya Admin</span>
                                        <span>{formatPrice(2500)}</span>
                                    </div>
                                    <div className="border-t border-gray-200 pt-2 mt-2">
                                        <div className="flex justify-between font-bold text-gray-900">
                                            <span>Total</span>
                                            <span className="text-purple-600">
                                                {formatPrice(promoResult?.valid ? promoResult.final_amount : getPlanPrice(selectedPlan) + 2500)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Method Selector */}
                                <div className="mt-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Metode Pembayaran:</p>
                                    {/* Selected method display row */}
                                    <button
                                        onClick={() => setShowMethodSheet(true)}
                                        className="w-full flex items-center justify-between px-4 py-3 border-2 border-purple-200 bg-purple-50 rounded-xl hover:border-purple-400 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            {paymentMethod === 'qris' ? (
                                                <>
                                                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                                                        <img src="/banks/qris.jpg" alt="QRIS" className="w-full h-full object-contain p-1"
                                                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.innerText = 'QR'; }} />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-sm font-semibold text-gray-900">QRIS</p>
                                                        <p className="text-xs text-gray-500">Scan dari e-wallet atau mobile banking</p>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div
                                                        className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 bg-white"
                                                    >
                                                        <img
                                                            src={`/banks/${selectedBank}.png`}
                                                            alt={VA_BANKS.find(b => b.code === selectedBank)?.name}
                                                            className="w-full h-full object-contain p-0.5"
                                                            onError={e => {
                                                                const el = e.target as HTMLImageElement;
                                                                el.style.display = 'none';
                                                                const parent = el.parentElement!;
                                                                parent.style.backgroundColor = VA_BANKS.find(b => b.code === selectedBank)?.color || '#7C3AED';
                                                                parent.innerText = selectedBank.toUpperCase().slice(0, 3);
                                                                parent.style.color = 'white';
                                                                parent.style.fontSize = '10px';
                                                                parent.style.fontWeight = 'bold';
                                                                parent.style.display = 'flex';
                                                                parent.style.alignItems = 'center';
                                                                parent.style.justifyContent = 'center';
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-sm font-semibold text-gray-900">{VA_BANKS.find(b => b.code === selectedBank)?.name}</p>
                                                        <p className="text-xs text-gray-500">Virtual Account</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 text-purple-600 text-xs font-medium">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Ganti
                                        </div>
                                    </button>
                                </div>

                                {/* Payment Method Bottom Sheet */}
                                {showMethodSheet && (
                                    <div
                                        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
                                        onClick={() => setShowMethodSheet(false)}
                                    >
                                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                                        <div
                                            className="relative bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-slide-up"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            {/* Sheet Header */}
                                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                                <h4 className="text-base font-bold text-gray-900">Pilih Metode Pembayaran</h4>
                                                <button
                                                    onClick={() => setShowMethodSheet(false)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                                                >
                                                    ✕
                                                </button>
                                            </div>

                                            <div className="px-6 py-4 space-y-5 max-h-[70vh] overflow-y-auto">
                                                {/* Bank Transfer */}
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Bank Transfer</p>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {VA_BANKS.map(bank => (
                                                            <button
                                                                key={bank.code}
                                                                onClick={() => {
                                                                    setPaymentMethod('va');
                                                                    setSelectedBank(bank.code);
                                                                    setShowMethodSheet(false);
                                                                }}
                                                                className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl border-2 transition-all ${paymentMethod === 'va' && selectedBank === bank.code
                                                                    ? 'border-purple-500 bg-purple-50'
                                                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                                                    }`}
                                                            >
                                                                <>
                                                                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 bg-white">
                                                                        <img
                                                                            src={`/banks/${bank.code}.png`}
                                                                            alt={bank.name}
                                                                            className="w-full h-full object-contain p-0.5"
                                                                            onError={e => {
                                                                                const el = e.target as HTMLImageElement;
                                                                                el.style.display = 'none';
                                                                                const parent = el.parentElement!;
                                                                                parent.style.backgroundColor = bank.color;
                                                                                parent.innerText = bank.code.toUpperCase().slice(0, 3);
                                                                                parent.style.color = 'white';
                                                                                parent.style.fontSize = '10px';
                                                                                parent.style.fontWeight = 'bold';
                                                                                parent.style.display = 'flex';
                                                                                parent.style.alignItems = 'center';
                                                                                parent.style.justifyContent = 'center';
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-xs font-medium text-gray-700 text-center leading-tight">{bank.name.replace('Bank ', '')}</span>
                                                                    {paymentMethod === 'va' && selectedBank === bank.code && (
                                                                        <div className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center">
                                                                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                            </svg>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* QRIS - Disabled (Coming Soon) */}
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">QR Code</p>
                                                    <div className="w-full flex items-center gap-4 py-3 px-4 rounded-xl border-2 border-gray-100 bg-gray-50 cursor-not-allowed opacity-50">
                                                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-200 bg-white flex-shrink-0">
                                                            <img src="/banks/qris.jpg" alt="QRIS" className="w-full h-full object-contain p-1 grayscale" />
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-semibold text-gray-400">QRIS</p>
                                                                <span className="text-[10px] font-semibold bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">Segera Hadir</span>
                                                            </div>
                                                            <p className="text-xs text-gray-400">Scan dari semua e-wallet &amp; mobile banking</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Promo Code Input */}
                                <div className="mt-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Kode Promo (Opsional):</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={promoCode}
                                            onChange={(e) => {
                                                setPromoCode(e.target.value.toUpperCase());
                                                if (promoResult) { setPromoResult(null); setPromoError(''); }
                                            }}
                                            placeholder="Masukkan kode promo"
                                            maxLength={20}
                                            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleValidatePromo}
                                            disabled={!promoCode.trim() || promoLoading}
                                            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl text-sm font-medium hover:bg-purple-200 disabled:opacity-50"
                                        >
                                            {promoLoading ? '...' : 'Cek'}
                                        </button>
                                    </div>
                                    {promoResult?.valid && (
                                        <div className="mt-2 flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                                            <span>✅</span>
                                            <span>Diskon {promoResult.discount_type === 'percentage' ? `${promoResult.discount_value}%` : formatPrice(promoResult.discount_value)} diterapkan!</span>
                                            <button onClick={resetPromo} className="ml-auto text-gray-400 hover:text-gray-600">✕</button>
                                        </div>
                                    )}
                                    {promoError && (
                                        <p className="mt-2 text-sm text-red-500">{promoError}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowUpgradeModal(false)}
                                className="flex-1 py-2 px-4 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmUpgrade}
                                disabled={upgrading}
                                className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium disabled:opacity-50"
                            >
                                {upgrading ? 'Memproses...' : selectedPlan.price === 0 ? 'Konfirmasi' : 'Bayar Sekarang'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* QRIS Payment Modal */}
            {showQRISModal && qrisData && (
                <QRISPaymentModal
                    qrisData={qrisData}
                    onSuccess={handleQRISSuccess}
                    onClose={() => {
                        setShowQRISModal(false);
                        setQrisData(null);
                    }}
                />
            )}

            {/* VA Payment Modal */}
            {showVAModal && vaData && (
                <VAPaymentModal
                    vaData={vaData}
                    onSuccess={handleVASuccess}
                    onClose={() => {
                        setShowVAModal(false);
                        setVaData(null);
                    }}
                />
            )}

            {/* Cancel Subscription Modal */}
            {showCancelModal && subscriptionData && (
                <CancelSubscriptionModal
                    planName={plans.find(p => p.id === currentPlan)?.name || currentPlan}
                    endDate={formatDate(subscriptionData.current_period_end)}
                    onConfirm={handleCancelConfirmed}
                    onClose={() => setShowCancelModal(false)}
                />
            )}
        </AppLayout>
    );
}

// Wrapper component with Suspense for useSearchParams
export default function SettingsPage() {
    return (
        <Suspense fallback={
            <AppLayout>
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                </div>
            </AppLayout>
        }>
            <SettingsContent />
        </Suspense>
    );
}
