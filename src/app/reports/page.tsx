'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { SalesReport, ProductSalesReport, getSalesReport, getProductSalesReport } from '@/lib/api';

export default function ReportsPage() {
    const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
    const [productReport, setProductReport] = useState<ProductSalesReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('month');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        loadReports();
    }, [dateRange, startDate, endDate]);

    const getDateRange = () => {
        const now = new Date();
        let start: Date, end: Date;

        switch (dateRange) {
            case 'today':
                start = end = now;
                break;
            case 'week':
                start = new Date(now);
                start.setDate(now.getDate() - 7);
                end = now;
                break;
            case 'month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = now;
                break;
            case 'custom':
                return { start: startDate, end: endDate };
            default:
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = now;
        }

        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0],
        };
    };

    const loadReports = async () => {
        setLoading(true);
        const { start, end } = getDateRange();

        const [salesData, productsData] = await Promise.all([
            getSalesReport(start, end),
            getProductSalesReport(start, end),
        ]);

        setSalesReport(salesData);
        setProductReport(productsData);
        setLoading(false);
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
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Laporan Penjualan</h1>
                <p className="text-gray-500">Analisis penjualan dan keuntungan</p>
            </div>

            {/* Date Range Selector */}
            <div className="flex flex-wrap gap-2 mb-6">
                {(['today', 'week', 'month', 'custom'] as const).map((range) => (
                    <button
                        key={range}
                        onClick={() => setDateRange(range)}
                        className={`px-4 py-2 rounded-xl font-medium transition-colors ${dateRange === range
                                ? 'bg-purple-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        {range === 'today' && 'Hari Ini'}
                        {range === 'week' && '7 Hari'}
                        {range === 'month' && 'Bulan Ini'}
                        {range === 'custom' && 'Custom'}
                    </button>
                ))}

                {dateRange === 'custom' && (
                    <div className="flex gap-2 items-center">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-xl"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-xl"
                        />
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <p className="text-sm text-gray-500">Total Penjualan</p>
                            <p className="text-2xl font-bold text-gray-900">{formatPrice(salesReport?.total_sales || 0)}</p>
                            <p className="text-xs text-gray-400">{salesReport?.total_transactions || 0} transaksi</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <p className="text-sm text-gray-500">Total Modal</p>
                            <p className="text-2xl font-bold text-gray-900">{formatPrice(salesReport?.total_cost || 0)}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <p className="text-sm text-gray-500">Laba Kotor</p>
                            <p className={`text-2xl font-bold ${(salesReport?.gross_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatPrice(salesReport?.gross_profit || 0)}
                            </p>
                            {salesReport?.total_sales ? (
                                <p className="text-xs text-gray-400">
                                    Margin: {((salesReport.gross_profit / salesReport.total_sales) * 100).toFixed(1)}%
                                </p>
                            ) : null}
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <p className="text-sm text-gray-500">Rata-rata per Transaksi</p>
                            <p className="text-2xl font-bold text-gray-900">{formatPrice(salesReport?.average_per_tx || 0)}</p>
                            <p className="text-xs text-gray-400">{salesReport?.total_items_sold || 0} item terjual</p>
                        </div>
                    </div>

                    {/* Product Sales Table */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="font-semibold text-gray-900">Penjualan per Produk</h2>
                        </div>
                        {productReport.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                Belum ada data penjualan
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Produk</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Qty</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Penjualan</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Modal</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Laba</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {productReport.map((product) => (
                                        <tr key={product.product_id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-900">{product.product_name}</td>
                                            <td className="px-4 py-3 text-right text-gray-600">{product.total_qty}</td>
                                            <td className="px-4 py-3 text-right text-gray-900">{formatPrice(product.total_sales)}</td>
                                            <td className="px-4 py-3 text-right text-gray-500">{formatPrice(product.total_cost)}</td>
                                            <td className={`px-4 py-3 text-right font-medium ${product.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatPrice(product.profit)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}
        </AppLayout>
    );
}
