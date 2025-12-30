'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { isAuthenticated, getCurrentUser, clearTokens, User, Tenant, Outlet, getOutlets, switchOutlet } from '@/lib/api';

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [currentOutlet, setCurrentOutlet] = useState<Outlet | null>(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [outletDropdownOpen, setOutletDropdownOpen] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            if (!isAuthenticated()) {
                router.push('/login');
                return;
            }

            const data = await getCurrentUser();
            if (data) {
                setUser(data.user);
                setTenant(data.tenant);
                // Fetch outlets if user is manager or owner on Bisnis+ plan
                if (data.user?.role === 'owner' || data.user?.role === 'manager') {
                    const outletList = await getOutlets();
                    setOutlets(outletList);
                    // Set current outlet from user's outlet_id or first outlet
                    if (data.user.outlet_id) {
                        const current = outletList.find(o => o.id === data.user.outlet_id);
                        setCurrentOutlet(current || outletList[0] || null);
                    } else if (outletList.length > 0) {
                        setCurrentOutlet(outletList[0]);
                    }
                }
            } else {
                // Clear invalid tokens to prevent redirect loop
                clearTokens();
                router.push('/login');
            }
            setLoading(false);
        };

        checkAuth();
    }, [router]);

    const handleLogout = () => {
        clearTokens();
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <Sidebar
                userRole={user?.role}
                userName={user?.name}
                tenantName={tenant?.name}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        {/* Mobile menu button */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 lg:hidden"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        {/* Outlet Switcher - Only show if multiple outlets */}
                        {outlets.length > 1 && (
                            <div className="relative">
                                <button
                                    onClick={() => setOutletDropdownOpen(!outletDropdownOpen)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <span className="text-sm font-medium hidden sm:block">{currentOutlet?.name || 'Pilih Outlet'}</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {outletDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                        {outlets.map((outlet) => (
                                            <button
                                                key={outlet.id}
                                                onClick={() => {
                                                    switchOutlet(outlet.id);
                                                    setOutletDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${currentOutlet?.id === outlet.id ? 'text-purple-700 font-medium bg-purple-50' : 'text-gray-700'
                                                    }`}
                                            >
                                                {outlet.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {tenant && outlets.length <= 1 && (
                            <span className="text-sm text-gray-500 hidden sm:block">
                                {tenant.name}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Notifications */}
                        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </button>

                        {/* User Menu */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                                title="Keluar"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 lg:p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
