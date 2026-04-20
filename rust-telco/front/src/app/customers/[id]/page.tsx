'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCustomer, deleteCustomer } from '@/lib/api';
import { Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
    Pencil, 
    Trash2, 
    ArrowLeft, 
    Building2, 
    User, 
    MapPin, 
    Phone, 
    Printer, 
    Globe2, 
    Briefcase,
    Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const router = useRouter();
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

    async function handleDelete() {
        if (confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
            await deleteCustomer(id);
            router.push('/customers');
        }
    }

    return (
        <div className="max-w-5xl mx-auto py-10 px-4">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Link 
                        href="/customers" 
                        className="text-sm font-medium text-slate-500 hover:text-blue-600 flex items-center gap-1 mb-2 transition-colors"
                    >
                        <ArrowLeft size={14} /> Volver a la lista
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                            <Building2 size={24} />
                        </div>
                        {customer.company_name}
                    </h1>
                    <p className="text-slate-500 ml-13">ID: <span className="font-mono">{customer.customer_id}</span></p>
                </div>
                
                <div className="flex gap-2">
                    <Link href={`/customers/${id}/edit`}>
                        <Button variant="outline" className="border-slate-200 hover:bg-slate-50">
                            <Pencil size={18} className="mr-2 text-amber-600" />
                            Editar
                        </Button>
                    </Link>
                    <Button variant="destructive" onClick={handleDelete} className="bg-red-50 text-red-600 hover:bg-red-100 border-none shadow-none">
                        <Trash2 size={18} className="mr-2" />
                        Eliminar Cliente
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Card de Contacto */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <User size={14} /> Información de Contacto
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <Label className="text-slate-500 text-[10px] uppercase font-bold">Nombre</Label>
                                <p className="text-slate-900 font-semibold">{customer.contact_name || 'No especificado'}</p>
                            </div>
                            <div>
                                <Label className="text-slate-500 text-[10px] uppercase font-bold">Cargo</Label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Briefcase size={14} className="text-slate-400" />
                                    <p className="text-slate-700">{customer.contact_title || 'No especificado'}</p>
                                </div>
                            </div>
                            <div className="pt-4 space-y-3">
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Phone size={16} className="text-blue-500" />
                                    <span className="text-sm">{customer.phone || 'Sin teléfono'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Printer size={16} className="text-slate-400" />
                                    <span className="text-sm">{customer.fax || 'Sin fax'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card de Ubicación */}
                <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                        <MapPin size={14} /> Detalles de Ubicación
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
                        <div className="space-y-1">
                            <Label className="text-slate-500 text-[10px] uppercase font-bold">Dirección Principal</Label>
                            <p className="text-slate-900 text-lg leading-snug">{customer.address || 'Sin dirección registrada'}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-6">
                                <div className="space-y-1 flex-1">
                                    <Label className="text-slate-500 text-[10px] uppercase font-bold">Ciudad</Label>
                                    <p className="text-slate-900 font-medium">{customer.city || '-'}</p>
                                </div>
                                <div className="space-y-1 flex-1">
                                    <Label className="text-slate-500 text-[10px] uppercase font-bold">Región</Label>
                                    <p className="text-slate-900 font-medium">{customer.region || '-'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                                <div className="space-y-1 flex-1">
                                    <Label className="text-slate-500 text-[10px] uppercase font-bold">Código Postal</Label>
                                    <p className="text-slate-900 font-medium font-mono">{customer.postal_code || '-'}</p>
                                </div>
                                <div className="space-y-1 flex-1">
                                    <Label className="text-slate-500 text-[10px] uppercase font-bold">País</Label>
                                    <div className="flex items-center gap-2">
                                        <Globe2 size={16} className="text-emerald-600" />
                                        <p className="text-slate-900 font-bold">{customer.country || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 p-6 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm">
                                <Building2 size={24} className="text-slate-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-tight">Estado de Cuenta</p>
                                <p className="text-emerald-600 font-bold">Cliente Activo</p>
                            </div>
                        </div>
                        <Link href="/customers">
                            <Button variant="link" className="text-blue-600 font-semibold p-0 h-auto">
                                Ver historial de pedidos
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}