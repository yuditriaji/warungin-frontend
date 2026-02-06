'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if already installed (standalone mode)
        const isInStandalone = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
        setIsStandalone(isInStandalone);

        // Check if iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
        setIsIOS(isIOSDevice);

        // Listen for beforeinstallprompt event (Chrome, Edge, etc.)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Show banner after a short delay to not be too intrusive
            setTimeout(() => setShowInstallBanner(true), 3000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // For iOS, show banner after delay if not in standalone
        if (isIOSDevice && !isInStandalone) {
            setTimeout(() => setShowInstallBanner(true), 5000);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setShowInstallBanner(false);
            }
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        setShowInstallBanner(false);
        // Store dismissal in localStorage to not show again for 7 days
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    };

    // Check if banner was recently dismissed
    useEffect(() => {
        const dismissedAt = localStorage.getItem('pwa-install-dismissed');
        if (dismissedAt) {
            const dismissedTime = parseInt(dismissedAt);
            const sevenDays = 7 * 24 * 60 * 60 * 1000;
            if (Date.now() - dismissedTime < sevenDays) {
                setShowInstallBanner(false);
            }
        }
    }, []);

    // Don't show if already installed or banner dismissed
    if (isStandalone || !showInstallBanner) {
        return null;
    }

    // iOS specific instructions
    if (isIOS) {
        return (
            <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
                <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                    <div className="p-4 bg-gradient-to-r from-purple-600 to-purple-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                                    <img src="/favicon.ico" alt="Warungin" className="w-6 h-6" />
                                </div>
                                <div className="text-white">
                                    <h3 className="font-semibold">Install Warungin</h3>
                                    <p className="text-xs opacity-90">Akses lebih cepat dari Home Screen</p>
                                </div>
                            </div>
                            <button onClick={handleDismiss} className="text-white/80 hover:text-white p-1">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50">
                        <p className="text-sm text-gray-600 mb-3">
                            Untuk menginstall di iPhone/iPad:
                        </p>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 text-sm text-gray-700">
                                <span className="flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-600 rounded-full text-xs font-bold">1</span>
                                <span>Tap tombol <strong>Share</strong> di Safari</span>
                                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2L8 6h3v8h2V6h3L12 2zM4 12v10h16V12h-2v8H6v-8H4z" />
                                </svg>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-700">
                                <span className="flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-600 rounded-full text-xs font-bold">2</span>
                                <span>Pilih <strong>"Add to Home Screen"</strong></span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-700">
                                <span className="flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-600 rounded-full text-xs font-bold">3</span>
                                <span>Tap <strong>"Add"</strong> untuk konfirmasi</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Android/Desktop install prompt
    if (deferredPrompt) {
        return (
            <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
                <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                    <div className="p-4">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                <img src="/favicon.ico" alt="Warungin" className="w-7 h-7" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900">Install Warungin</h3>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Akses lebih cepat langsung dari Home Screen. Tidak perlu buka browser!
                                </p>
                            </div>
                            <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="mt-4 flex gap-3">
                            <button
                                onClick={handleDismiss}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                Nanti saja
                            </button>
                            <button
                                onClick={handleInstallClick}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Install
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
