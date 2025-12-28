'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Receipt from '@/components/Receipt';
import { Product, getProducts, createTransaction, Transaction } from '@/lib/api';

export default function POSPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState<{ product: Product; qty: number }[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [processing, setProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        const data = await getProducts();
        setProducts(data);
        setLoading(false);
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

    const handleCheckout = async (paymentMethod: string) => {
        if (cart.length === 0) return;

        setProcessing(true);

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

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AppLayout>
            <div className="h-full flex gap-6">
                {/* Product Grid */}
                <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-xl font-bold text-gray-900">Kasir</h1>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Cari produk..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex-1 bg-white rounded-xl border border-gray-200 p-12 text-center flex items-center justify-center">
                            <div>
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada produk</h3>
                                <p className="text-gray-500 mb-4">Tambahkan produk di halaman Produk terlebih dahulu</p>
                                <a href="/products" className="text-purple-600 hover:underline">
                                    Ke halaman Produk →
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-auto">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {filteredProducts.map((product) => (
                                    <button
                                        key={product.id}
                                        onClick={() => addToCart(product)}
                                        className="bg-white rounded-xl border border-gray-200 p-3 text-left hover:border-purple-300 hover:shadow-md transition-all"
                                    >
                                        <div className="w-full h-20 bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                                            {product.image_url ? (
                                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                                            ) : (
                                                <span className="text-2xl">📦</span>
                                            )}
                                        </div>
                                        <h3 className="font-medium text-gray-900 text-sm truncate">{product.name}</h3>
                                        <p className="text-purple-600 font-bold text-sm">{formatPrice(product.price)}</p>
                                        <p className="text-xs text-gray-400">Stok: {product.stock_qty}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Cart Sidebar */}
                <div className="w-80 bg-white rounded-xl border border-gray-200 p-4 flex flex-col">
                    <h2 className="font-semibold text-gray-900 mb-4">Keranjang ({cart.length})</h2>

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
                                    <div className="flex-1">
                                        <p className="font-medium text-sm text-gray-900 truncate">{item.product.name}</p>
                                        <p className="text-purple-600 text-sm">{formatPrice(item.product.price * item.qty)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => updateQty(item.product.id, item.qty - 1)}
                                            className="w-6 h-6 bg-gray-200 rounded text-gray-600 hover:bg-gray-300"
                                        >
                                            -
                                        </button>
                                        <span className="w-6 text-center text-sm">{item.qty}</span>
                                        <button
                                            onClick={() => updateQty(item.product.id, item.qty + 1)}
                                            className="w-6 h-6 bg-purple-100 rounded text-purple-600 hover:bg-purple-200"
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

                        {/* Payment Buttons */}
                        <div className="space-y-2">
                            <button
                                onClick={() => handleCheckout('cash')}
                                disabled={cart.length === 0 || processing}
                                className={`w-full py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${cart.length === 0 || processing
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                    }`}
                            >
                                💵 Bayar Tunai
                            </button>
                            <button
                                onClick={() => handleCheckout('qris')}
                                disabled={cart.length === 0 || processing}
                                className={`w-full py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${cart.length === 0 || processing
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'bg-purple-600 text-white hover:bg-purple-700'
                                    }`}
                            >
                                📱 QRIS
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccess && lastTransaction && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
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

            {/* Processing Overlay */}
            {processing && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 text-center">
                        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Memproses transaksi...</p>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
