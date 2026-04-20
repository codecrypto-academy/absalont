'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { 
    Users, 
    Plus, 
    Search, 
    Eye, 
    Pencil, 
    Trash2, 
    ChevronLeft, 
    ChevronRight,
    Loader2
} from 'lucide-react';
import { Customer } from '@/lib/types';
import { getCustomers, deleteCustomer } from '@/lib/api';
import Link from 'next/link';

function CustomersContent() {
    const searchParams = useSearchParams();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [nameFilter, setNameFilter] = useState(searchParams.get('name_filter') || '');
    const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
    const [loading, setLoading] = useState(true);

    const loadCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getCustomers({
                page,
                per_page: 10,
                name_filter: nameFilter || undefined,
            });
            setCustomers(data);
        } catch (error) {
            console.error("Error cargando clientes:", error);
        } finally {
            setLoading(false);
        }
    }, [page, nameFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadCustomers();
        }, 300); // Debounce
        return () => clearTimeout(timer);
    }, [page, nameFilter, loadCustomers]);

    async function handleDelete(id: string) {
        if (confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
            try {
                const response = await deleteCustomer(id);
                // Si hay un error en la respuesta (aunque sea 200 JSON con error field)
                if (response && response.error) {
                    alert(`Error: ${response.error}`);
                } else {
                    loadCustomers();
                }
            } catch (error: any) {
                console.error("Error al eliminar cliente:", error);
                const message = error.message || "Error desconocido";
                alert(`No se pudo eliminar el cliente.\n\nDetalle técnico: ${message}\n\nNota: Es probable que el cliente tenga pedidos o registros relacionados en la base de datos.`);
            }
        }
    }

    return (
        <div className="max-w-6xl mx-auto py-10 px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Users className="text-blue-600" size={32} />
                        Gestión de Clientes
                    </h1>
                    <p className="text-slate-500 mt-1">Administra la base de datos de clientes de Northwind</p>
                </div>
                <Link href="/customers/add">
                    <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">
                        <Plus className="mr-2" size={18} />
                        Nuevo Cliente
                    </Button>
                </Link>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                            placeholder="Buscar por nombre de empresa..."
                            value={nameFilter}
                            onChange={(e) => {
                                setNameFilter(e.target.value);
                                setPage(1); // Reset to page 1 on search
                            }}
                            className="pl-10 bg-white border-slate-200 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <Loader2 className="animate-spin mb-4" size={40} />
                            <p>Cargando información...</p>
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="text-center py-20 text-slate-500">
                            <p className="text-lg font-medium">No se encontraron clientes</p>
                            <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="font-bold text-slate-700">ID</TableHead>
                                    <TableHead className="font-bold text-slate-700">Empresa</TableHead>
                                    <TableHead className="font-bold text-slate-700">Contacto</TableHead>
                                    <TableHead className="font-bold text-slate-700">País</TableHead>
                                    <TableHead className="text-right font-bold text-slate-700">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.map((customer) => (
                                    <TableRow key={customer.customer_id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="font-medium text-blue-600">{customer.customer_id}</TableCell>
                                        <TableCell className="font-semibold">{customer.company_name}</TableCell>
                                        <TableCell>{customer.contact_name}</TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                                {customer.country}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link 
                                                    href={`/customers/${customer.customer_id}`}
                                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 h-9 w-9 text-slate-600 hover:text-blue-600"
                                                    title="Ver detalles"
                                                >
                                                    <Eye size={18} />
                                                </Link>
                                                <Link 
                                                    href={`/customers/${customer.customer_id}/edit`}
                                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 h-9 w-9 text-slate-600 hover:text-amber-600"
                                                    title="Editar"
                                                >
                                                    <Pencil size={18} />
                                                </Link>
                                                <button 
                                                    onClick={() => {
                                                        console.log("Eliminando cliente:", customer.customer_id);
                                                        handleDelete(customer.customer_id);
                                                    }}
                                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 h-9 w-9 text-slate-600 hover:text-red-600"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                        Página <span className="font-medium text-slate-900">{page}</span>
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                            className="bg-white"
                        >
                            <ChevronLeft size={16} className="mr-1" />
                            Anterior
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => p + 1)}
                            disabled={customers.length < 10 || loading}
                            className="bg-white"
                        >
                            Siguiente
                            <ChevronRight size={16} className="ml-1" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CustomersPage() {
    return (
        <Suspense fallback={
            <div className="max-w-6xl mx-auto py-10 px-4 text-center">
                <Loader2 className="animate-spin mx-auto text-blue-600" size={40} />
            </div>
        }>
            <CustomersContent />
        </Suspense>
    );
}