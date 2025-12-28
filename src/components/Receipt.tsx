'use client';

import { Transaction } from '@/lib/api';

interface ReceiptProps {
    transaction: Transaction;
    businessName?: string;
    businessAddress?: string;
    onClose: () => void;
}

export default function Receipt({
    transaction,
    businessName = 'Warungin',
    businessAddress = '',
    onClose
}: ReceiptProps) {

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handlePrint = () => {
        const printContent = document.getElementById('receipt-content');
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Struk - ${transaction.invoice_number}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', monospace;
            width: 80mm;
            padding: 10mm;
            font-size: 12px;
          }
          .header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
          }
          .header h1 {
            font-size: 18px;
            margin-bottom: 5px;
          }
          .header p {
            font-size: 10px;
            color: #666;
          }
          .info {
            margin: 10px 0;
            font-size: 11px;
          }
          .info p {
            display: flex;
            justify-content: space-between;
          }
          .items {
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 10px 0;
            margin: 10px 0;
          }
          .item {
            margin-bottom: 8px;
          }
          .item-name {
            font-weight: bold;
          }
          .item-detail {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
          }
          .total {
            padding: 10px 0;
            border-bottom: 1px dashed #000;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
          }
          .total-row.grand {
            font-weight: bold;
            font-size: 16px;
            margin-top: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 15px;
            font-size: 10px;
          }
          @media print {
            body {
              width: 100%;
            }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);

        printWindow.document.close();
        printWindow.focus();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="font-bold text-lg">Struk Transaksi</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Receipt Content */}
                <div className="flex-1 overflow-auto p-4">
                    <div id="receipt-content" className="font-mono text-sm">
                        {/* Business Header */}
                        <div className="text-center border-b border-dashed border-gray-300 pb-4 mb-4">
                            <h1 className="text-xl font-bold">{businessName}</h1>
                            {businessAddress && <p className="text-xs text-gray-500">{businessAddress}</p>}
                        </div>

                        {/* Transaction Info */}
                        <div className="text-xs space-y-1 mb-4">
                            <div className="flex justify-between">
                                <span>No:</span>
                                <span>{transaction.invoice_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tanggal:</span>
                                <span>{formatDate(transaction.created_at)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Pembayaran:</span>
                                <span className="uppercase">{transaction.payment_method}</span>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="border-t border-b border-dashed border-gray-300 py-4 my-4 space-y-3">
                            {transaction.items?.map((item, idx) => (
                                <div key={idx}>
                                    <div className="font-bold">{item.product?.name || `Produk ${idx + 1}`}</div>
                                    <div className="flex justify-between text-xs">
                                        <span>{item.quantity} x {formatPrice(item.unit_price)}</span>
                                        <span>{formatPrice(item.subtotal)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span>Subtotal</span>
                                <span>{formatPrice(transaction.subtotal)}</span>
                            </div>
                            {transaction.discount > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Diskon</span>
                                    <span>-{formatPrice(transaction.discount)}</span>
                                </div>
                            )}
                            {transaction.tax > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span>Pajak</span>
                                    <span>{formatPrice(transaction.tax)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-lg pt-2 border-t border-dashed border-gray-300">
                                <span>TOTAL</span>
                                <span>{formatPrice(transaction.total)}</span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="text-center text-xs text-gray-500 mt-6 pt-4 border-t border-dashed border-gray-300">
                            <p>Terima kasih atas kunjungan Anda!</p>
                            <p className="mt-1">Powered by Warungin</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-gray-200 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50"
                    >
                        Tutup
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Cetak
                    </button>
                </div>
            </div>
        </div>
    );
}
