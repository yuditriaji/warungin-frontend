'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Receipt from '@/components/Receipt';
import { Product, getProducts, createTransaction, Transaction, TenantSettings, getTenantSettings } from '@/lib/api';

export default function POSPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState<{ product: Product; qty: number }[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [processing, setProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [showCart, setShowCart] = useState(false);
    const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);

    // QRIS state
    const [qrisSettings, setQrisSettings] = useState<TenantSettings | null>(null);
    const [showQrisModal, setShowQrisModal] = useState(false);

    // Confirmation modal state
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingPaymentMethod, setPendingPaymentMethod] = useState<string>('');

    useEffect(() => {
        loadProducts();
        loadQrisSettings();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        const data = await getProducts();
        setProducts(data);
        setLoading(false);
    };

    const loadQrisSettings = async () => {
        const settings = await getTenantSettings();
        setQrisSettings(settings);
    };

    const addToCart = (product: Product) => {
        const existing = cart.find(item => item.product.id === product.id);
        if (existing) {
            setCart(cart.map(item =>
                item.product.id === product.id
                    ? { ...item, qty: item.qty + 1 }
                    : item
            ));
        } else {
            setCart([...cart, { product, qty: 1 }]);
        }
    };

    const removeFromCart = (productId: string) => {
        setCart(cart.filter(item => item.product.id !== productId));
    };

    const updateQty = (productId: string, qty: number) => {
        if (qty <= 0) {
            removeFromCart(productId);
        } else {
            setCart(cart.map(item =>
                item.product.id === productId
                    ? { ...item, qty }
                    : item
            ));
        }
    };

    const getTotal = () => {
        return cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
    };

    const getTotalItems = () => {
        return cart.reduce((sum, item) => sum + item.qty, 0);
    };

    const handleCheckout = async (paymentMethod: string) => {
        if (cart.length === 0) return;

        setProcessing(true);
        setShowCart(false);

        const result = await createTransaction({
            items: cart.map(item => ({
                product_id: item.product.id,
                quantity: item.qty,
            })),
            payment_method: paymentMethod,
        });

        if (result) {
            setLastTransaction(result);
            setShowSuccess(true);
            setCart([]);
            loadProducts();
        } else {
            alert('Gagal memproses transaksi');
        }

        setProcessing(false);
    };

    // Handle QRIS button click - show modal if QRIS is configured
    const handleQrisClick = () => {
        if (cart.length === 0) return;
        if (!qrisSettings?.qris_enabled || !qrisSettings?.qris_image_url) {
            alert('QRIS belum dikonfigurasi. Silakan atur di halaman Pengaturan.');
            return;
        }
        setShowCart(false);
        setShowQrisModal(true);
    };

    // Confirm QRIS payment (manual confirmation by cashier)
    const handleConfirmQrisPayment = async () => {
        setShowQrisModal(false);
        await handleCheckout('qris');
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(price);
    };

    // Open confirmation modal before checkout
    const openConfirmModal = (paymentMethod: string) => {
        if (cart.length === 0) return;
        setPendingPaymentMethod(paymentMethod);
        setShowCart(false);
        setShowConfirmModal(true);
    };

    // Confirm and proceed with checkout
    const confirmCheckout = async () => {
        setShowConfirmModal(false);
        await handleCheckout(pendingPaymentMethod);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AppLayout>
            <div className="h-full flex flex-col">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                    <h1 className="text-xl font-bold text-gray-900">Kasir</h1>
                    <div className="relative flex-1 sm:flex-initial sm:w-64">
                        <input
                            type="text"
                            placeholder="Cari produk..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="flex-1 overflow-auto pb-24 lg:pb-0 lg:flex lg:gap-6">
                    <div className="flex-1">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                            </div>
                        ) : products.length === 0 ? (
                            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada produk</h3>
                                <p className="text-gray-500 mb-4">Tambahkan produk di halaman Produk</p>
                                <a href="/products" className="text-purple-600 hover:underline">
                                    Ke halaman Produk →
                                </a>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                {filteredProducts.map((product) => (
                                    <button
                                        key={product.id}
                                        onClick={() => addToCart(product)}
                                        className="bg-white rounded-xl border border-gray-200 p-3 text-left hover:border-purple-300 hover:shadow-md transition-all active:scale-95"
                                    >
                                        <div className="w-full aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                                            {product.image_url ? (
                                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                                            ) : (
                                                <span className="text-3xl">📦</span>
                                            )}
                                        </div>
                                        <h3 className="font-medium text-gray-900 text-sm truncate">{product.name}</h3>
                                        <p className="text-purple-600 font-bold text-sm">{formatPrice(product.price)}</p>
                                        <p className="text-xs text-gray-400">Stok: {product.stock_qty}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Desktop Cart Sidebar */}
                    <div className="hidden lg:flex lg:w-80 bg-white rounded-xl border border-gray-200 p-4 flex-col">
                        <h2 className="font-semibold text-gray-900 mb-4">Keranjang ({getTotalItems()})</h2>

                        {cart.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-center">
                                <div>
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-500 text-sm">Keranjang kosong</p>
                                    <p className="text-gray-400 text-xs mt-1">Klik produk untuk menambahkan</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-auto space-y-3">
                                {cart.map((item) => (
                                    <div key={item.product.id} className="flex gap-3 p-2 bg-gray-50 rounded-lg">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm text-gray-900 truncate">{item.product.name}</p>
                                            <p className="text-purple-600 text-sm">{formatPrice(item.product.price * item.qty)}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => updateQty(item.product.id, item.qty - 1)}
                                                className="w-7 h-7 bg-gray-200 rounded text-gray-600 hover:bg-gray-300"
                                            >
                                                -
                                            </button>
                                            <span className="w-6 text-center text-sm">{item.qty}</span>
                                            <button
                                                onClick={() => updateQty(item.product.id, item.qty + 1)}
                                                className="w-7 h-7 bg-purple-100 rounded text-purple-600 hover:bg-purple-200"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Cart Footer */}
                        <div className="border-t border-gray-100 pt-4 mt-4">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-gray-600">Total</span>
                                <span className="text-xl font-bold text-gray-900">{formatPrice(getTotal())}</span>
                            </div>
                            <div className="space-y-2">
                                <button
                                    onClick={() => openConfirmModal('cash')}
                                    disabled={cart.length === 0 || processing}
                                    className={`w-full py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${cart.length === 0 || processing
                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                        : 'bg-green-600 text-white hover:bg-green-700'
                                        }`}
                                >
                                    💵 Bayar Tunai
                                </button>
                                <button
                                    onClick={handleQrisClick}
                                    disabled={cart.length === 0 || processing || !qrisSettings?.qris_enabled}
                                    className={`w-full py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${cart.length === 0 || processing || !qrisSettings?.qris_enabled
                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                        : 'bg-purple-600 text-white hover:bg-purple-700'
                                        }`}
                                >
                                    📱 {qrisSettings?.qris_label || 'QRIS'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Floating Cart Button */}
                <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 lg:hidden bg-gradient-to-t from-gray-50 via-gray-50 to-transparent">
                    <button
                        onClick={() => setShowCart(true)}
                        className="w-full bg-purple-600 text-white py-4 px-6 rounded-2xl font-semibold shadow-xl flex items-center gap-3"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>Keranjang ({getTotalItems()})</span>
                        <span className="ml-auto font-bold">{formatPrice(getTotal())}</span>
                    </button>
                </div>

                {/* Mobile Cart Drawer */}
                {showCart && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)} />
                        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] flex flex-col animate-slide-up">
                            {/* Cart Header */}
                            <div className="flex justify-between items-center p-4 border-b border-gray-100">
                                <h2 className="font-semibold text-gray-900">Keranjang ({getTotalItems()})</h2>
                                <button onClick={() => setShowCart(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Cart Items */}
                            <div className="flex-1 overflow-auto p-4 space-y-3">
                                {cart.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500">Keranjang kosong</p>
                                    </div>
                                ) : (
                                    cart.map((item) => (
                                        <div key={item.product.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 truncate">{item.product.name}</p>
                                                <p className="text-purple-600 font-semibold">{formatPrice(item.product.price * item.qty)}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => updateQty(item.product.id, item.qty - 1)}
                                                    className="w-8 h-8 bg-gray-200 rounded-lg text-gray-600 font-bold"
                                                >
                                                    -
                                                </button>
                                                <span className="w-6 text-center font-medium">{item.qty}</span>
                                                <button
                                                    onClick={() => updateQty(item.product.id, item.qty + 1)}
                                                    className="w-8 h-8 bg-purple-100 rounded-lg text-purple-600 font-bold"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Cart Footer */}
                            <div className="p-4 border-t border-gray-100 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Total</span>
                                    <span className="text-2xl font-bold text-gray-900">{formatPrice(getTotal())}</span>
                                </div>
                                <button
                                    onClick={() => openConfirmModal('cash')}
                                    disabled={cart.length === 0}
                                    className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${cart.length === 0
                                        ? 'bg-gray-200 text-gray-500'
                                        : 'bg-green-600 text-white'
                                        }`}
                                >
                                    💵 Bayar Tunai
                                </button>
                                <button
                                    onClick={handleQrisClick}
                                    disabled={cart.length === 0 || !qrisSettings?.qris_enabled}
                                    className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${cart.length === 0 || !qrisSettings?.qris_enabled
                                        ? 'bg-gray-200 text-gray-500'
                                        : 'bg-purple-600 text-white'
                                        }`}
                                >
                                    📱 {qrisSettings?.qris_label || 'QRIS'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Success Modal */}
            {showSuccess && lastTransaction && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Transaksi Berhasil!</h2>
                        <p className="text-gray-500 mb-4">Invoice: {lastTransaction.invoice_number}</p>
                        <p className="text-2xl font-bold text-purple-600 mb-6">{formatPrice(lastTransaction.total)}</p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSuccess(false)}
                                className="flex-1 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50"
                            >
                                Tutup
                            </button>
                            <button
                                onClick={() => {
                                    setShowSuccess(false);
                                    setShowReceipt(true);
                                }}
                                className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700"
                            >
                                Cetak Struk
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt Modal */}
            {showReceipt && lastTransaction && (
                <Receipt
                    transaction={lastTransaction}
                    onClose={() => setShowReceipt(false)}
                />
            )}

            {/* QRIS Payment Modal */}
            {showQrisModal && qrisSettings && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full text-center">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            Pembayaran {qrisSettings.qris_label || 'QRIS'}
                        </h2>
                        <p className="text-gray-500 mb-4">Scan QR Code untuk membayar</p>

                        {/* Total Amount */}
                        <p className="text-3xl font-bold text-purple-600 mb-4">
                            {formatPrice(getTotal())}
                        </p>

                        {/* QRIS Image */}
                        <div className="w-64 h-64 mx-auto mb-4 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                            <img
                                src={qrisSettings.qris_image_url}
                                alt="QRIS"
                                className="w-full h-full object-contain"
                            />
                        </div>

                        <p className="text-sm text-gray-500 mb-6">
                            Setelah pelanggan membayar, tekan tombol konfirmasi
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowQrisModal(false)}
                                className="flex-1 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleConfirmQrisPayment}
                                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700"
                            >
                                ✓ Konfirmasi Pembayaran
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Transaction Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-auto">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 text-center">Konfirmasi Transaksi</h2>
                        </div>

                        {/* Order Items */}
                        <div className="p-4 max-h-60 overflow-auto">
                            <h3 className="text-sm font-medium text-gray-500 mb-3">Detail Pesanan</h3>
                            <div className="space-y-3">
                                {cart.map((item) => (
                                    <div key={item.product.id} className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{item.product.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {item.qty} x {formatPrice(item.product.price)}
                                            </p>
                                        </div>
                                        <p className="font-medium text-gray-900">
                                            {formatPrice(item.product.price * item.qty)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="p-4 bg-gray-50 border-t border-gray-100">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-gray-600">Total Item</span>
                                <span className="font-medium">{getTotalItems()} item</span>
                            </div>
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-gray-600">Metode Bayar</span>
                                <span className="font-medium px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm">
                                    {pendingPaymentMethod === 'cash' ? '💵 Tunai' : '📱 QRIS'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                                <span className="text-lg font-bold text-gray-900">Total</span>
                                <span className="text-2xl font-bold text-purple-600">{formatPrice(getTotal())}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 flex gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmCheckout}
                                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 flex items-center justify-center gap-2"
                            >
                                ✓ Konfirmasi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Processing Overlay */}
            {processing && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 text-center">
                        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Memproses transaksi...</p>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
            `}</style>
        </AppLayout>
    );
}
