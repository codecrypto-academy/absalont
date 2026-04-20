'use client';

import React, { useEffect, useState } from 'react';
import { getCustomer, updateCustomer } from '@/lib/api';
import CustomerForm from '../../_components/CustomerForm';
import { Customer } from '@/lib/types';
import { Pencil, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getCustomer(id)
            .then(setCustomer)
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto py-20 px-4 text-center">
                <Loader2 className="animate-spin mx-auto text-blue-600" size={40} />
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="max-w-4xl mx-auto py-20 px-4 text-center">
                <p className="text-xl font-semibold text-slate-900">Cliente no encontrado</p>
                <Link href="/customers" className="text-blue-600 hover:underline mt-4 inline-block">
                    Volver a la lista
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <Link 
                        href="/customers" 
                        className="text-sm font-medium text-slate-500 hover:text-blue-600 flex items-center gap-1 mb-2 transition-colors"
                    >
                        <ArrowLeft size={14} /> Volver a la lista
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                            <Pencil size={24} />
                        </div>
                        Editar Cliente: <span className="text-slate-500">{customer.customer_id}</span>
                    </h1>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-100 p-8">
                <CustomerForm 
                    initialData={customer} 
                    onSubmit={(data) => updateCustomer(id, data)} 
                />
            </div>
        </div>
    );
}