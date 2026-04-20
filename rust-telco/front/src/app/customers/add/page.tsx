'use client';

import { createCustomer } from '@/lib/api';
import CustomerForm from '../_components/CustomerForm';
import { UserPlus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AddCustomerPage() {
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
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                            <UserPlus size={24} />
                        </div>
                        Nuevo Cliente
                    </h1>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-100 p-8">
                <CustomerForm onSubmit={createCustomer} />
            </div>
        </div>
    );
}