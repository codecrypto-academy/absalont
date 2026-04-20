'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Customer } from '@/lib/types';
import { 
    Save, 
    X, 
    User, 
    Building2, 
    Briefcase, 
    MapPin, 
    Globe2, 
    Phone, 
    Printer, 
    Hash,
    Loader2
} from 'lucide-react';

interface CustomerFormProps {
    initialData?: Customer;
    onSubmit: (data: Customer) => Promise<any>;
}

export default function CustomerForm({ initialData, onSubmit }: CustomerFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Customer>(initialData || {
        customer_id: '',
        company_name: '',
        contact_name: '',
        contact_title: '',
        address: '',
        city: '',
        region: '',
        postal_code: '',
        country: '',
        phone: '',
        fax: '',
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await onSubmit(formData);
            console.log("Cliente guardado:", response);
            
            // Forzamos la redirección a la lista de clientes
            router.push('/customers');
            router.refresh();
        } catch (error) {
            console.error("Error al guardar cliente:", error);
            alert("Hubo un error al guardar el cliente. Por favor, revisa los datos.");
        } finally {
            setLoading(false);
        }
    }

    const inputClasses = "bg-white border-slate-200 focus:ring-2 focus:ring-blue-500 transition-all";

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Sección: Información Principal */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-2 mb-4">
                        <Building2 size={20} className="text-blue-600" />
                        <h3 className="font-bold uppercase tracking-wider text-xs">Información de la Empresa</h3>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="customer_id" className="text-slate-700 font-medium flex items-center gap-2">
                                <Hash size={14} /> ID Cliente
                            </Label>
                            <Input
                                id="customer_id"
                                value={formData.customer_id}
                                onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
                                required
                                disabled={!!initialData}
                                placeholder="Ej: ALFKI"
                                className={`${inputClasses} font-mono uppercase`}
                            />
                            {!initialData && <p className="text-[10px] text-slate-500 italic">Debe ser un código único de 5 caracteres.</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="company_name" className="text-slate-700 font-medium">Nombre de la Empresa</Label>
                            <Input
                                id="company_name"
                                value={formData.company_name}
                                onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                                required
                                placeholder="Nombre comercial completo"
                                className={inputClasses}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="contact_name" className="text-slate-700 font-medium flex items-center gap-2">
                                    <User size={14} /> Contacto
                                </Label>
                                <Input
                                    id="contact_name"
                                    value={formData.contact_name || ''}
                                    onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                                    placeholder="Nombre completo"
                                    className={inputClasses}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contact_title" className="text-slate-700 font-medium flex items-center gap-2">
                                    <Briefcase size={14} /> Cargo
                                </Label>
                                <Input
                                    id="contact_title"
                                    value={formData.contact_title || ''}
                                    onChange={(e) => setFormData({...formData, contact_title: e.target.value})}
                                    placeholder="Ej: Gerente"
                                    className={inputClasses}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sección: Ubicación y Contacto */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-2 mb-4">
                        <MapPin size={20} className="text-blue-600" />
                        <h3 className="font-bold uppercase tracking-wider text-xs">Ubicación y Contacto</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="address" className="text-slate-700 font-medium">Dirección</Label>
                            <Input
                                id="address"
                                value={formData.address || ''}
                                onChange={(e) => setFormData({...formData, address: e.target.value})}
                                placeholder="Calle, número, oficina..."
                                className={inputClasses}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city" className="text-slate-700 font-medium">Ciudad</Label>
                                <Input
                                    id="city"
                                    value={formData.city || ''}
                                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                                    className={inputClasses}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="region" className="text-slate-700 font-medium">Región/Estado</Label>
                                <Input
                                    id="region"
                                    value={formData.region || ''}
                                    onChange={(e) => setFormData({...formData, region: e.target.value})}
                                    className={inputClasses}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="postal_code" className="text-slate-700 font-medium">Código Postal</Label>
                                <Input
                                    id="postal_code"
                                    value={formData.postal_code || ''}
                                    onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                                    className={inputClasses}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country" className="text-slate-700 font-medium flex items-center gap-2">
                                    <Globe2 size={14} /> País
                                </Label>
                                <Input
                                    id="country"
                                    value={formData.country || ''}
                                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                                    className={inputClasses}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-slate-700 font-medium flex items-center gap-2">
                                    <Phone size={14} /> Teléfono
                                </Label>
                                <Input
                                    id="phone"
                                    value={formData.phone || ''}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    className={inputClasses}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fax" className="text-slate-700 font-medium flex items-center gap-2">
                                    <Printer size={14} /> Fax
                                </Label>
                                <Input
                                    id="fax"
                                    value={formData.fax || ''}
                                    onChange={(e) => setFormData({...formData, fax: e.target.value})}
                                    className={inputClasses}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.back()}
                    className="border-slate-200 text-slate-600"
                    disabled={loading}
                >
                    <X size={18} className="mr-2" />
                    Cancelar
                </Button>
                <Button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 min-w-[120px]"
                    disabled={loading}
                >
                    {loading ? (
                        <Loader2 size={18} className="animate-spin mr-2" />
                    ) : (
                        <Save size={18} className="mr-2" />
                    )}
                    {initialData ? 'Actualizar' : 'Guardar Cliente'}
                </Button>
            </div>
        </form>
    );
}