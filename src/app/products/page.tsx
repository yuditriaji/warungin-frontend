'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import {
    Product,
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductActive,
    CreateProductInput,
    RawMaterial,
    ProductMaterial,
    getMaterials,
    getProductMaterials,
    linkMaterial,
    unlinkMaterial,
    calculateProductCost
} from '@/lib/api';

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showMaterialModal, setShowMaterialModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [materials, setMaterials] = useState<RawMaterial[]>([]);
    const [productMaterials, setProductMaterials] = useState<ProductMaterial[]>([]);
    const [materialCost, setMaterialCost] = useState(0);
    const [selectedMaterial, setSelectedMaterial] = useState('');
    const [quantityUsed, setQuantityUsed] = useState(0);

    const [formData, setFormData] = useState<CreateProductInput>({
        name: '',
        price: 0,
        sku: '',
        cost: 0,
        stock_qty: 0,
    });
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        loadProducts();
        loadMaterials();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        const data = await getProducts();
        setProducts(data);
        setLoading(false);
    };

    const loadMaterials = async () => {
        const data = await getMaterials();
        setMaterials(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        let result: Product | null = null;
        if (editingId) {
            // Update existing product
            result = await updateProduct(editingId, formData);
            if (result) {
                setProducts(products.map(p => p.id === editingId ? result! : p));
            }
        } else {
            // Create new product
            result = await createProduct(formData);
            if (result) {
                setProducts([...products, result]);
            }
        }

        if (result) {
            setShowModal(false);
            setEditingId(null);
            setFormData({ name: '', price: 0, sku: '', cost: 0, stock_qty: 0 });
        }
        setSaving(false);
    };

    const openEditModal = (product: Product) => {
        setEditingId(product.id);
        setFormData({
            name: product.name,
            price: product.price,
            sku: product.sku || '',
            cost: product.cost || 0,
            stock_qty: product.stock_qty || 0,
        });
        setShowModal(true);
    };

    const openCreateModal = () => {
        setEditingId(null);
        setFormData({ name: '', price: 0, sku: '', cost: 0, stock_qty: 0 });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Hapus produk ini?')) {
            const success = await deleteProduct(id);
            if (success) {
                setProducts(products.filter(p => p.id !== id));
            }
        }
    };

    const handleToggleActive = async (product: Product) => {
        const newStatus = !product.is_active;
        const result = await toggleProductActive(product.id, newStatus);
        if (result) {
            setProducts(products.map(p => p.id === product.id ? result : p));
        }
    };

    const openMaterialModal = async (product: Product) => {
        setSelectedProduct(product);
        setShowMaterialModal(true);
        const { materials: pm, material_cost } = await getProductMaterials(product.id);
        setProductMaterials(pm);
        setMaterialCost(material_cost);
    };

    const handleLinkMaterial = async () => {
        if (!selectedProduct || !selectedMaterial || quantityUsed <= 0) return;

        const success = await linkMaterial(selectedProduct.id, selectedMaterial, quantityUsed);
        if (success) {
            const { materials: pm, material_cost } = await getProductMaterials(selectedProduct.id);
            setProductMaterials(pm);
            setMaterialCost(material_cost);
            setSelectedMaterial('');
            setQuantityUsed(0);
        }
    };

    const handleUnlinkMaterial = async (materialId: string) => {
        if (!selectedProduct) return;

        const success = await unlinkMaterial(selectedProduct.id, materialId);
        if (success) {
            const { materials: pm, material_cost } = await getProductMaterials(selectedProduct.id);
            setProductMaterials(pm);
            setMaterialCost(material_cost);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(price);
    };

    return (
        <AppLayout>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Produk</h1>
                    <p className="text-gray-500">Kelola produk yang dijual</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah Produk
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                </div>
            ) : products.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada produk</h3>
                    <p className="text-gray-500 mb-6">Mulai dengan menambahkan produk pertama Anda</p>
                    <button
                        onClick={openCreateModal}
                        className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                    >
                        Tambah Produk Pertama
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {products.map((product) => (
                        <div key={product.id} className={`bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow ${!product.is_active ? 'opacity-60' : ''}`}>
                            <div className="relative w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                                {!product.is_active && (
                                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-gray-600 text-white text-xs rounded-full">
                                        Nonaktif
                                    </div>
                                )}
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                )}
                            </div>
                            <h3 className="font-medium text-gray-900 mb-1 truncate">{product.name}</h3>
                            <p className="text-lg font-bold text-purple-600 mb-2">{formatPrice(product.price)}</p>
                            <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                                <span>Stok: {product.stock_qty}</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => openEditModal(product)}
                                    className="py-2 px-3 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 flex items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit
                                </button>
                                <button
                                    onClick={() => openMaterialModal(product)}
                                    className="flex-1 py-2 px-3 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    Bahan
                                </button>
                                <button
                                    onClick={() => handleToggleActive(product)}
                                    className={`py-2 px-3 text-sm rounded-lg flex items-center gap-1 ${product.is_active
                                            ? 'text-orange-500 hover:bg-orange-50'
                                            : 'text-green-500 hover:bg-green-50'
                                        }`}
                                >
                                    {product.is_active ? (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                            </svg>
                                            Nonaktif
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Aktifkan
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Product Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            {editingId ? 'Edit Produk' : 'Tambah Produk'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                                    placeholder="Nasi Goreng"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Harga Jual *</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.price || ''}
                                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                                        placeholder="15000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Modal</label>
                                    <input
                                        type="number"
                                        value={formData.cost || ''}
                                        onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                                        placeholder="10000"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                                    <input
                                        type="text"
                                        value={formData.sku || ''}
                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                                        placeholder="NG-001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stok</label>
                                    <input
                                        type="number"
                                        value={formData.stock_qty || ''}
                                        onChange={(e) => setFormData({ ...formData, stock_qty: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                                        placeholder="100"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {saving ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Material Linking Modal */}
            {showMaterialModal && selectedProduct && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-auto">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Bahan Baku</h2>
                                <p className="text-gray-500">{selectedProduct.name}</p>
                            </div>
                            <button
                                onClick={() => setShowMaterialModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Cost Summary */}
                        {productMaterials.length > 0 && (
                            <div className="bg-purple-50 rounded-xl p-4 mb-4">
                                <p className="text-sm text-purple-600">Total Biaya Bahan</p>
                                <p className="text-2xl font-bold text-purple-700">{formatPrice(materialCost)}</p>
                            </div>
                        )}

                        {/* Linked Materials */}
                        {productMaterials.length > 0 && (
                            <div className="mb-4">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Bahan Terkait</h3>
                                <div className="space-y-2">
                                    {productMaterials.map((pm) => (
                                        <div key={pm.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-gray-900">{pm.material.name}</p>
                                                <p className="text-sm text-gray-500">
                                                    {pm.quantity_used} {pm.material.unit} × {formatPrice(pm.material.unit_price)} = {formatPrice(pm.quantity_used * pm.material.unit_price)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleUnlinkMaterial(pm.material_id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Add Material */}
                        <div className="border-t border-gray-100 pt-4">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Tambah Bahan</h3>
                            {materials.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">
                                    Belum ada bahan baku. <a href="/materials" className="text-purple-600">Tambah bahan baku →</a>
                                </p>
                            ) : (
                                <div className="flex gap-2">
                                    <select
                                        value={selectedMaterial}
                                        onChange={(e) => setSelectedMaterial(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                    >
                                        <option value="">Pilih bahan...</option>
                                        {materials.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.name} ({m.unit})
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={quantityUsed || ''}
                                        onChange={(e) => setQuantityUsed(Number(e.target.value))}
                                        placeholder="Jumlah"
                                        className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                    />
                                    <button
                                        onClick={handleLinkMaterial}
                                        disabled={!selectedMaterial || quantityUsed <= 0}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        +
                                    </button>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setShowMaterialModal(false)}
                            className="w-full mt-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
                        >
                            Selesai
                        </button>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
