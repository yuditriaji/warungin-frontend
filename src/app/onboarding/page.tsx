'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getCurrentUser, updateTenantProfile, BUSINESS_TYPES, Tenant, Region, getProvinces, getCities } from '@/lib/api';

export default function OnboardingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [tenant, setTenant] = useState<Tenant | null>(null);

    const [businessName, setBusinessName] = useState('');
    const [businessType, setBusinessType] = useState('');
    const [customBusinessType, setCustomBusinessType] = useState(''); // For "Lainnya" option
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    // Address hierarchy
    const [provinces, setProvinces] = useState<Region[]>([]);
    const [cities, setCities] = useState<Region[]>([]);
    const [selectedProvince, setSelectedProvince] = useState<{ id: string; name: string } | null>(null);
    const [selectedCity, setSelectedCity] = useState<{ id: string; name: string } | null>(null);
    const [postalCode, setPostalCode] = useState('');
    const [loadingCities, setLoadingCities] = useState(false);

    // Referral code
    const [referralCode, setReferralCode] = useState('');
    const [referralValid, setReferralValid] = useState<boolean | null>(null);
    const [validatingReferral, setValidatingReferral] = useState(false);

    // User agreement
    const [agreementAccepted, setAgreementAccepted] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);

    const [error, setError] = useState('');

    useEffect(() => {
        const checkAuth = async () => {
            try {
                if (!isAuthenticated()) {
                    router.push('/login');
                    return;
                }

                const data = await getCurrentUser();
                if (!data) {
                    // Token invalid or expired — send back to login
                    router.push('/login');
                    return;
                }

                setTenant(data.tenant);
                setBusinessName(data.tenant.name || '');

                // If already has business_type, redirect to dashboard
                if (data.tenant.business_type) {
                    router.push('/dashboard');
                    return;
                }

                // Load provinces
                const provincesData = await getProvinces();
                setProvinces(provincesData);

                // Helper to get cookie value
                const getCookie = (name: string) => {
                    const value = `; ${document.cookie}`;
                    const parts = value.split(`; ${name}=`);
                    if (parts.length === 2) return parts.pop()?.split(';').shift();
                    return null;
                };

                // Check for referral code in URL params first, then cookie
                const urlParams = new URLSearchParams(window.location.search);
                const urlRef = urlParams.get('ref');
                const cookieRef = getCookie('referral_code');
                const refCode = urlRef || cookieRef;

                if (refCode) {
                    setReferralCode(refCode);
                    validateReferralCode(refCode);
                }
            } catch (error) {
                console.error('Onboarding auth check failed:', error);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    // Validate referral code against API
    const validateReferralCode = async (code: string) => {
        if (!code) {
            setReferralValid(null);
            return;
        }
        setValidatingReferral(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/referral/validate/${code}`);
            setReferralValid(res.ok);
        } catch {
            setReferralValid(false);
        } finally {
            setValidatingReferral(false);
        }
    };

    // Load cities when province changes
    const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const provinceId = e.target.value;
        const province = provinces.find(p => p.id === provinceId);

        if (province) {
            setSelectedProvince({ id: province.id, name: province.name });
            setSelectedCity(null);
            setCities([]);
            setLoadingCities(true);

            const citiesData = await getCities(provinceId);
            setCities(citiesData);
            setLoadingCities(false);
        } else {
            setSelectedProvince(null);
            setSelectedCity(null);
            setCities([]);
        }
    };

    const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const cityId = e.target.value;
        const city = cities.find(c => c.id === cityId);

        if (city) {
            setSelectedCity({ id: city.id, name: city.name });
        } else {
            setSelectedCity(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!businessType) {
            setError('Pilih jenis bisnis Anda');
            return;
        }

        // Validate custom business type for "Lainnya"
        if (businessType === 'other' && !customBusinessType.trim()) {
            setError('Masukkan jenis bisnis Anda');
            return;
        }

        // Validate mandatory address fields
        if (!selectedProvince) {
            setError('Pilih provinsi Anda');
            return;
        }

        if (!selectedCity) {
            setError('Pilih kota/kabupaten Anda');
            return;
        }

        setSaving(true);

        // Use custom business type if "other" is selected
        const finalBusinessType = businessType === 'other' ? customBusinessType.trim() : businessType;

        const result = await updateTenantProfile({
            name: businessName,
            business_type: finalBusinessType,
            phone,
            address,
            province_id: selectedProvince?.id,
            province_name: selectedProvince?.name,
            city_id: selectedCity?.id,
            city_name: selectedCity?.name,
            postal_code: postalCode,
            referral_code: referralValid ? referralCode : undefined,
            user_agreement_accepted: agreementAccepted,
        });

        if (result) {
            router.push('/dashboard');
        } else {
            setError('Gagal menyimpan profil. Silakan coba lagi.');
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
                <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                        <span className="text-3xl">🚀</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Lengkapi Profil Bisnis
                    </h1>
                    <p className="text-gray-500">
                        Bantu kami memahami bisnis Anda untuk pengalaman yang lebih baik
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Business Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nama Bisnis
                        </label>
                        <input
                            type="text"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Contoh: Barbershop Mas Bro"
                            required
                        />
                    </div>

                    {/* Business Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Jenis Bisnis <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {BUSINESS_TYPES.map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setBusinessType(type.value)}
                                    className={`p-4 rounded-xl border-2 text-left transition-all ${businessType === type.value
                                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                        }`}
                                >
                                    <span className="text-lg block mb-1">
                                        {type.value === 'barbershop' && '💈'}
                                        {type.value === 'salon' && '💅'}
                                        {type.value === 'autoshop' && '🔧'}
                                        {type.value === 'laundry' && '🧺'}
                                        {type.value === 'fnb' && '🍽️'}
                                        {type.value === 'retail' && '🏪'}
                                        {type.value === 'other' && '📦'}
                                    </span>
                                    <span className="text-sm font-medium">{type.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Custom input for "Lainnya" */}
                        {businessType === 'other' && (
                            <div className="mt-3">
                                <input
                                    type="text"
                                    value={customBusinessType}
                                    onChange={(e) => setCustomBusinessType(e.target.value)}
                                    className="w-full px-4 py-3 border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-purple-50"
                                    placeholder="Masukkan jenis bisnis Anda..."
                                />
                            </div>
                        )}
                    </div>

                    {/* Phone (Optional) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nomor Telepon <span className="text-gray-400">(opsional)</span>
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="08xxxxxxxxxx"
                        />
                    </div>

                    {/* Province & City */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Provinsi <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedProvince?.id || ''}
                                onChange={handleProvinceChange}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                            >
                                <option value="">Pilih Provinsi</option>
                                {provinces.map((province) => (
                                    <option key={province.id} value={province.id}>
                                        {province.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Kota/Kabupaten <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={selectedCity?.id || ''}
                                onChange={handleCityChange}
                                disabled={!selectedProvince || loadingCities}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                <option value="">
                                    {loadingCities ? 'Memuat...' : 'Pilih Kota'}
                                </option>
                                {cities.map((city) => (
                                    <option key={city.id} value={city.id}>
                                        {city.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Postal Code */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Kode Pos <span className="text-gray-400">(opsional)</span>
                        </label>
                        <input
                            type="text"
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="12345"
                            maxLength={5}
                        />
                    </div>

                    {/* Address Detail */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Alamat Lengkap <span className="text-gray-400">(opsional)</span>
                        </label>
                        <textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                            rows={2}
                            placeholder="Jl. Contoh No. 123"
                        />
                    </div>

                    {/* Referral Code */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Kode Referral <span className="text-gray-400">(opsional)</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={referralCode}
                                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                                onBlur={() => validateReferralCode(referralCode)}
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${referralValid === true ? 'border-green-500' : referralValid === false ? 'border-red-300' : 'border-gray-200'}`}
                                placeholder="Contoh: BUDI1234"
                            />
                            {validatingReferral && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="w-5 h-5 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin"></div>
                                </div>
                            )}
                            {!validatingReferral && referralValid === true && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">✓</div>
                            )}
                            {!validatingReferral && referralValid === false && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">✗</div>
                            )}
                        </div>
                        {referralValid === true && (
                            <p className="text-green-600 text-sm mt-1">Kode referral valid!</p>
                        )}
                        {referralValid === false && referralCode && (
                            <p className="text-red-500 text-sm mt-1">Kode referral tidak ditemukan</p>
                        )}
                    </div>

                    {/* User Agreement */}
                    <div className="flex items-start gap-3 mt-6 mb-2">
                        <div className="flex items-center h-5 mt-1">
                            <input
                                id="agreement"
                                type="checkbox"
                                checked={agreementAccepted}
                                onChange={(e) => setAgreementAccepted(e.target.checked)}
                                className="w-5 h-5 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500 focus:ring-2 cursor-pointer"
                            />
                        </div>
                        <label htmlFor="agreement" className="text-sm text-gray-600 leading-relaxed cursor-pointer">
                            Saya menyetujui <button type="button" onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} className="font-semibold text-purple-600 hover:text-purple-700 hover:underline">Syarat dan Ketentuan</button> serta <button type="button" onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }} className="font-semibold text-purple-600 hover:text-purple-700 hover:underline">Kebijakan Privasi</button> aplikasi Warungin.
                        </label>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={saving || !agreementAccepted}
                        className="w-full py-4 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                    >
                        {saving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                Mulai Sekarang
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Terms & Conditions Modal */}
            {showTermsModal && (
                <PolicyModal
                    title="Syarat dan Ketentuan"
                    onClose={() => setShowTermsModal(false)}
                >
                    <TermsContent />
                </PolicyModal>
            )}

            {/* Privacy Policy Modal */}
            {showPrivacyModal && (
                <PolicyModal
                    title="Kebijakan Privasi"
                    onClose={() => setShowPrivacyModal(false)}
                >
                    <PrivacyContent />
                </PolicyModal>
            )}
        </div>
    );
}

function PolicyModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                {/* Content */}
                <div className="overflow-y-auto p-6 text-sm text-gray-700 leading-relaxed space-y-4">
                    {children}
                </div>
                {/* Footer */}
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}

function TermsContent() {
    return (
        <>
            <p className="text-xs text-gray-400">Terakhir diperbarui: 1 Maret 2026</p>

            <h3 className="font-bold text-gray-900 text-base">1. Penerimaan Ketentuan</h3>
            <p>Dengan mengakses dan menggunakan aplikasi Warungin (&quot;Aplikasi&quot;), Anda menyetujui dan terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak menyetujui ketentuan ini, mohon untuk tidak menggunakan Aplikasi.</p>

            <h3 className="font-bold text-gray-900 text-base">2. Deskripsi Layanan</h3>
            <p>Warungin adalah platform manajemen bisnis berbasis cloud yang menyediakan fitur-fitur berikut:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>Point of Sale (POS) untuk pencatatan transaksi penjualan</li>
                <li>Manajemen produk dan inventaris</li>
                <li>Manajemen bahan baku</li>
                <li>Laporan keuangan dan analitik bisnis</li>
                <li>Manajemen pelanggan</li>
                <li>Manajemen outlet dan staf</li>
            </ul>

            <h3 className="font-bold text-gray-900 text-base">3. Akun Pengguna</h3>
            <ul className="list-disc pl-5 space-y-1">
                <li>Anda bertanggung jawab untuk menjaga kerahasiaan informasi akun Anda.</li>
                <li>Anda bertanggung jawab atas semua aktivitas yang terjadi di bawah akun Anda.</li>
                <li>Anda wajib memberikan informasi yang akurat dan terkini saat mendaftar.</li>
                <li>Satu akun hanya boleh digunakan oleh satu entitas bisnis.</li>
            </ul>

            <h3 className="font-bold text-gray-900 text-base">4. Paket Layanan dan Pembayaran</h3>
            <ul className="list-disc pl-5 space-y-1">
                <li>Warungin menyediakan paket Gratis dengan fitur terbatas dan paket berbayar dengan fitur lebih lengkap.</li>
                <li>Pembayaran untuk paket berbayar dilakukan melalui metode pembayaran yang tersedia di Aplikasi.</li>
                <li>Harga paket dapat berubah sewaktu-waktu dengan pemberitahuan sebelumnya kepada pengguna.</li>
                <li>Pembayaran yang telah dilakukan tidak dapat dikembalikan (non-refundable), kecuali dinyatakan lain.</li>
            </ul>

            <h3 className="font-bold text-gray-900 text-base">5. Penggunaan yang Dilarang</h3>
            <p>Anda dilarang menggunakan Aplikasi untuk:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>Kegiatan yang melanggar hukum atau peraturan yang berlaku di Indonesia.</li>
                <li>Mengunggah, menyimpan, atau mendistribusikan konten yang bersifat ilegal, berbahaya, atau melanggar hak pihak lain.</li>
                <li>Mencoba mengakses sistem, jaringan, atau data secara tidak sah.</li>
                <li>Mengganggu kinerja atau keamanan Aplikasi.</li>
                <li>Menyalahgunakan fitur promosi, kode referral, atau program afiliasi.</li>
            </ul>

            <h3 className="font-bold text-gray-900 text-base">6. Kepemilikan Data</h3>
            <ul className="list-disc pl-5 space-y-1">
                <li>Data bisnis yang Anda masukkan ke dalam Aplikasi tetap menjadi milik Anda.</li>
                <li>Warungin berhak menggunakan data secara agregat dan anonim untuk keperluan analitik dan peningkatan layanan.</li>
                <li>Anda dapat meminta ekspor atau penghapusan data Anda kapan saja dengan menghubungi tim dukungan kami.</li>
            </ul>

            <h3 className="font-bold text-gray-900 text-base">7. Ketersediaan Layanan</h3>
            <ul className="list-disc pl-5 space-y-1">
                <li>Kami berusaha menjaga ketersediaan layanan 24/7, namun tidak menjamin layanan bebas gangguan.</li>
                <li>Pemeliharaan terjadwal akan diinformasikan sebelumnya melalui Aplikasi atau email.</li>
                <li>Kami tidak bertanggung jawab atas kerugian akibat gangguan layanan di luar kendali kami.</li>
            </ul>

            <h3 className="font-bold text-gray-900 text-base">8. Batasan Tanggung Jawab</h3>
            <p>Warungin disediakan &quot;sebagaimana adanya&quot; tanpa jaminan apapun. Kami tidak bertanggung jawab atas:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>Kerugian bisnis, kehilangan keuntungan, atau kerusakan data yang timbul dari penggunaan Aplikasi.</li>
                <li>Keputusan bisnis yang diambil berdasarkan data atau laporan dari Aplikasi.</li>
                <li>Ketidakakuratan data yang dimasukkan oleh pengguna.</li>
            </ul>

            <h3 className="font-bold text-gray-900 text-base">9. Penghentian Layanan</h3>
            <ul className="list-disc pl-5 space-y-1">
                <li>Anda dapat menghentikan penggunaan Aplikasi kapan saja.</li>
                <li>Kami berhak menangguhkan atau menghentikan akun Anda jika terjadi pelanggaran terhadap Syarat dan Ketentuan ini.</li>
                <li>Setelah penghentian, data Anda akan disimpan selama 30 hari sebelum dihapus secara permanen.</li>
            </ul>

            <h3 className="font-bold text-gray-900 text-base">10. Perubahan Ketentuan</h3>
            <p>Kami berhak mengubah Syarat dan Ketentuan ini sewaktu-waktu. Perubahan akan berlaku efektif setelah dipublikasikan di Aplikasi. Penggunaan berkelanjutan setelah perubahan dianggap sebagai persetujuan Anda terhadap ketentuan yang diperbarui.</p>

            <h3 className="font-bold text-gray-900 text-base">11. Hukum yang Berlaku</h3>
            <p>Syarat dan Ketentuan ini diatur oleh dan ditafsirkan sesuai dengan hukum Republik Indonesia. Segala sengketa yang timbul akan diselesaikan melalui musyawarah terlebih dahulu, dan jika tidak tercapai kesepakatan, melalui pengadilan yang berwenang di Indonesia.</p>

            <h3 className="font-bold text-gray-900 text-base">12. Kontak</h3>
            <p>Jika Anda memiliki pertanyaan mengenai Syarat dan Ketentuan ini, silakan hubungi kami melalui email di <span className="font-semibold">support@warungin.com</span>.</p>
        </>
    );
}

function PrivacyContent() {
    return (
        <>
            <p className="text-xs text-gray-400">Terakhir diperbarui: 1 Maret 2026</p>

            <h3 className="font-bold text-gray-900 text-base">1. Pendahuluan</h3>
            <p>Warungin (&quot;kami&quot;) berkomitmen untuk melindungi privasi dan keamanan data pribadi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi informasi Anda saat menggunakan aplikasi Warungin.</p>

            <h3 className="font-bold text-gray-900 text-base">2. Data yang Kami Kumpulkan</h3>
            <p className="font-semibold text-gray-800">a. Data Pribadi:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>Nama lengkap</li>
                <li>Alamat email (termasuk melalui Google OAuth)</li>
                <li>Nomor telepon</li>
                <li>Alamat bisnis (provinsi, kota, kode pos)</li>
            </ul>
            <p className="font-semibold text-gray-800 mt-2">b. Data Bisnis:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>Nama dan jenis usaha</li>
                <li>Data produk dan harga</li>
                <li>Data transaksi penjualan</li>
                <li>Data inventaris dan stok</li>
                <li>Data pelanggan yang Anda masukkan</li>
                <li>Data bahan baku</li>
            </ul>
            <p className="font-semibold text-gray-800 mt-2">c. Data Teknis:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>Alamat IP dan informasi perangkat</li>
                <li>Data penggunaan Aplikasi (fitur yang diakses, waktu akses)</li>
                <li>Log aktivitas untuk keamanan</li>
            </ul>

            <h3 className="font-bold text-gray-900 text-base">3. Cara Kami Menggunakan Data</h3>
            <p>Data Anda digunakan untuk:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>Menyediakan dan memelihara layanan Aplikasi</li>
                <li>Memproses transaksi dan menghasilkan laporan bisnis Anda</li>
                <li>Mengelola akun dan autentikasi pengguna</li>
                <li>Mengirim pemberitahuan penting terkait layanan</li>
                <li>Meningkatkan kualitas dan fitur Aplikasi</li>
                <li>Memproses pembayaran langganan</li>
                <li>Mencegah penipuan dan menjaga keamanan platform</li>
            </ul>

            <h3 className="font-bold text-gray-900 text-base">4. Penyimpanan dan Keamanan Data</h3>
            <ul className="list-disc pl-5 space-y-1">
                <li>Data Anda disimpan pada server yang aman dengan enkripsi standar industri.</li>
                <li>Kami menggunakan protokol HTTPS untuk semua transmisi data.</li>
                <li>Akses ke database dibatasi hanya untuk personel yang berwenang.</li>
                <li>Token autentikasi (JWT) digunakan untuk mengamankan sesi pengguna.</li>
                <li>Kami melakukan backup data secara berkala untuk mencegah kehilangan data.</li>
            </ul>

            <h3 className="font-bold text-gray-900 text-base">5. Berbagi Data dengan Pihak Ketiga</h3>
            <p>Kami <span className="font-semibold">tidak menjual</span> data pribadi Anda. Data hanya dibagikan dengan:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li><span className="font-semibold">Penyedia layanan pembayaran</span> (Doku) — untuk memproses pembayaran langganan.</li>
                <li><span className="font-semibold">Google OAuth</span> — untuk autentikasi akun.</li>
                <li><span className="font-semibold">Penyedia infrastruktur cloud</span> — untuk hosting dan penyimpanan data secara aman.</li>
                <li><span className="font-semibold">Pihak berwenang</span> — jika diwajibkan oleh hukum yang berlaku.</li>
            </ul>

            <h3 className="font-bold text-gray-900 text-base">6. Hak Anda</h3>
            <p>Anda memiliki hak untuk:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li><span className="font-semibold">Mengakses</span> — melihat data pribadi yang kami simpan tentang Anda.</li>
                <li><span className="font-semibold">Memperbaiki</span> — memperbarui atau mengoreksi data yang tidak akurat.</li>
                <li><span className="font-semibold">Menghapus</span> — meminta penghapusan data pribadi Anda.</li>
                <li><span className="font-semibold">Mengekspor</span> — meminta salinan data Anda dalam format yang dapat dibaca.</li>
                <li><span className="font-semibold">Mencabut persetujuan</span> — menarik kembali persetujuan atas penggunaan data kapan saja.</li>
            </ul>

            <h3 className="font-bold text-gray-900 text-base">7. Cookie dan Penyimpanan Lokal</h3>
            <ul className="list-disc pl-5 space-y-1">
                <li>Kami menggunakan localStorage untuk menyimpan token autentikasi sesi Anda.</li>
                <li>Cookie digunakan untuk menyimpan preferensi dan kode referral.</li>
                <li>Anda dapat menghapus data ini melalui pengaturan browser Anda kapan saja.</li>
            </ul>

            <h3 className="font-bold text-gray-900 text-base">8. Retensi Data</h3>
            <ul className="list-disc pl-5 space-y-1">
                <li>Data akun aktif disimpan selama akun Anda aktif.</li>
                <li>Setelah penghapusan akun, data akan dihapus dalam waktu 30 hari.</li>
                <li>Data transaksi dapat disimpan lebih lama sesuai kebutuhan hukum dan perpajakan.</li>
                <li>Backup sistem dihapus secara berkala sesuai jadwal retensi.</li>
            </ul>

            <h3 className="font-bold text-gray-900 text-base">9. Perlindungan Data Anak</h3>
            <p>Aplikasi Warungin tidak ditujukan untuk pengguna di bawah usia 18 tahun. Kami tidak secara sengaja mengumpulkan data dari anak-anak.</p>

            <h3 className="font-bold text-gray-900 text-base">10. Perubahan Kebijakan</h3>
            <p>Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan signifikan akan diberitahukan melalui email atau notifikasi di dalam Aplikasi. Kami mendorong Anda untuk meninjau kebijakan ini secara berkala.</p>

            <h3 className="font-bold text-gray-900 text-base">11. Kontak</h3>
            <p>Untuk pertanyaan mengenai Kebijakan Privasi ini atau permintaan terkait data pribadi Anda, silakan hubungi kami:</p>
            <ul className="list-disc pl-5 space-y-1">
                <li>Email: <span className="font-semibold">support@warungin.com</span></li>
            </ul>
        </>
    );
}
