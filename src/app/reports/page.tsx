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
    const [showExportMenu, setShowExportMenu] = useState(false);

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

    const formatPriceRaw = (price: number) => {
        return price.toString();
    };

    const downloadCSV = () => {
        if (productReport.length === 0) return;

        const { start, end } = getDateRange();
        const headers = ['Produk', 'Qty Terjual', 'Total Penjualan', 'Total Modal', 'Laba'];
        const rows = productReport.map(p => [
            p.product_name,
            p.total_qty.toString(),
            formatPriceRaw(p.total_sales),
            formatPriceRaw(p.total_cost),
            formatPriceRaw(p.profit)
        ]);

        // Add summary row
        rows.push([]);
        rows.push(['=== RINGKASAN ===']);
        rows.push(['Total Penjualan', '', formatPriceRaw(salesReport?.total_sales || 0)]);
        rows.push(['Total Modal', '', formatPriceRaw(salesReport?.total_cost || 0)]);
        rows.push(['Laba Kotor', '', formatPriceRaw(salesReport?.gross_profit || 0)]);
        rows.push(['Total Transaksi', '', (salesReport?.total_transactions || 0).toString()]);
        rows.push(['Total Item Terjual', '', (salesReport?.total_items_sold || 0).toString()]);

        const csvContent = [
            `Laporan Penjualan Warungin`,
            `Periode: ${start} s/d ${end}`,
            '',
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `laporan-penjualan-${start}-${end}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        setShowExportMenu(false);
    };

    const downloadExcel = () => {
        if (productReport.length === 0) return;

        const { start, end } = getDateRange();

        // Create Excel-compatible HTML table
        const htmlContent = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
            <head><meta charset="UTF-8"></head>
            <body>
                <h2>Laporan Penjualan Warungin</h2>
                <p>Periode: ${start} s/d ${end}</p>
                <table border="1">
                    <thead>
                        <tr style="background-color: #f3f4f6; font-weight: bold;">
                            <th>Produk</th>
                            <th>Qty Terjual</th>
                            <th>Total Penjualan</th>
                            <th>Total Modal</th>
                            <th>Laba</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productReport.map(p => `
                            <tr>
                                <td>${p.product_name}</td>
                                <td style="text-align: right;">${p.total_qty}</td>
                                <td style="text-align: right;">${formatPrice(p.total_sales)}</td>
                                <td style="text-align: right;">${formatPrice(p.total_cost)}</td>
                                <td style="text-align: right; color: ${p.profit >= 0 ? 'green' : 'red'};">${formatPrice(p.profit)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <br/>
                <h3>Ringkasan</h3>
                <table border="1">
                    <tr><td><b>Total Penjualan</b></td><td>${formatPrice(salesReport?.total_sales || 0)}</td></tr>
                    <tr><td><b>Total Modal</b></td><td>${formatPrice(salesReport?.total_cost || 0)}</td></tr>
                    <tr><td><b>Laba Kotor</b></td><td style="color: ${(salesReport?.gross_profit || 0) >= 0 ? 'green' : 'red'};">${formatPrice(salesReport?.gross_profit || 0)}</td></tr>
                    <tr><td><b>Total Transaksi</b></td><td>${salesReport?.total_transactions || 0}</td></tr>
                    <tr><td><b>Total Item Terjual</b></td><td>${salesReport?.total_items_sold || 0}</td></tr>
                </table>
            </body>
            </html>
        `;

        const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `laporan-penjualan-${start}-${end}.xls`;
        link.click();
        URL.revokeObjectURL(url);
        setShowExportMenu(false);
    };

    return (
        <AppLayout>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Laporan Penjualan</h1>
                    <p className="text-gray-500">Analisis penjualan dan keuntungan</p>
                </div>

                {/* Export Button */}
                <div className="relative">
                    <button
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        disabled={loading || productReport.length === 0}
                        className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export
                    </button>

                    {showExportMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-10">
                            <button
                                onClick={downloadCSV}
                                className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2 rounded-t-xl"
                            >
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download CSV
                            </button>
                            <button
                                onClick={downloadExcel}
                                className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2 rounded-b-xl border-t border-gray-100"
                            >
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Download Excel
                            </button>
                        </div>
                    )}
                </div>
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
