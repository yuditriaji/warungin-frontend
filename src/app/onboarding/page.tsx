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

    const [error, setError] = useState('');

    useEffect(() => {
        const checkAuth = async () => {
            if (!isAuthenticated()) {
                router.push('/login');
                return;
            }

            const data = await getCurrentUser();
            if (data) {
                setTenant(data.tenant);
                setBusinessName(data.tenant.name || '');

                // If already has business_type, redirect to dashboard
                if (data.tenant.business_type) {
                    router.push('/dashboard');
                    return;
                }
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

            setLoading(false);
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
                            Saya menyetujui <a href="#" className="font-semibold text-purple-600 hover:text-purple-700 hover:underline">Syarat dan Ketentuan</a> serta <a href="#" className="font-semibold text-purple-600 hover:text-purple-700 hover:underline">Kebijakan Privasi</a> aplikasi Warungin.
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
        </div>
    );
}
