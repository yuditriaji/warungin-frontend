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
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    // Address hierarchy
    const [provinces, setProvinces] = useState<Region[]>([]);
    const [cities, setCities] = useState<Region[]>([]);
    const [selectedProvince, setSelectedProvince] = useState<{ id: string; name: string } | null>(null);
    const [selectedCity, setSelectedCity] = useState<{ id: string; name: string } | null>(null);
    const [postalCode, setPostalCode] = useState('');
    const [loadingCities, setLoadingCities] = useState(false);

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

            setLoading(false);
        };

        checkAuth();
    }, [router]);

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

        setSaving(true);
        const result = await updateTenantProfile({
            name: businessName,
            business_type: businessType,
            phone,
            address,
            province_id: selectedProvince?.id,
            province_name: selectedProvince?.name,
            city_id: selectedCity?.id,
            city_name: selectedCity?.name,
            postal_code: postalCode,
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
                                Provinsi
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
                                Kota/Kabupaten
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

                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-4 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
