'use client';

import { useState } from 'react';
import { cancelSubscription } from '@/lib/api';

interface CancelSubscriptionModalProps {
    planName: string;
    endDate: string;
    onConfirm: () => void;
    onClose: () => void;
}

export default function CancelSubscriptionModal({ planName, endDate, onConfirm, onClose }: CancelSubscriptionModalProps) {
    const [cancelling, setCancelling] = useState(false);

    const handleCancel = async () => {
        setCancelling(true);
        const result = await cancelSubscription();
        setCancelling(false);

        if (result) {
            onConfirm();
        } else {
            alert('Gagal membatalkan langganan. Silakan coba lagi.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                    <h3 className="text-lg font-bold text-white">Batalkan Langganan</h3>
                </div>

                <div className="p-6">
                    <p className="text-gray-700 mb-4">
                        Apakah Anda yakin ingin membatalkan langganan <span className="font-semibold text-purple-600">{planName}</span>?
                    </p>

                    {/* What you'll lose */}
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4">
                        <p className="text-sm font-semibold text-red-800 mb-2">Setelah berakhir, Anda akan kehilangan:</p>
                        <ul className="text-sm text-red-700 space-y-1">
                            <li className="flex items-center gap-2">
                                <span className="text-red-400">✕</span> Akses fitur premium
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-red-400">✕</span> Batas produk lebih tinggi
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-red-400">✕</span> Multi-outlet & staff
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-red-400">✕</span> Transaksi unlimited
                            </li>
                        </ul>
                    </div>

                    {/* Reassurance */}
                    <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6">
                        <p className="text-sm text-green-800">
                            <span className="font-semibold">💡 Jangan khawatir:</span> Anda tetap memiliki akses penuh
                            ke semua fitur hingga <span className="font-semibold">{endDate}</span>.
                            Anda juga bisa mengaktifkan kembali kapan saja sebelum tanggal tersebut.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 px-4 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleCancel}
                            disabled={cancelling}
                            className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50"
                        >
                            {cancelling ? 'Memproses...' : 'Ya, Batalkan'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
