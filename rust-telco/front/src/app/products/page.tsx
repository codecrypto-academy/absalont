'use client';

import { useState, useEffect } from 'react';
import { getProducts } from '@/lib/api';
import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { Package, ShoppingCart, Loader2, Tag, Box } from 'lucide-react';

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();

    useEffect(() => {
        getProducts()
            .then(setProducts)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto py-20 px-4 text-center">
                <Loader2 className="animate-spin mx-auto text-blue-600" size={40} />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto py-10 px-4">
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-extrabold text-slate-900 flex items-center justify-center gap-3">
                    <Package className="text-blue-600" size={36} />
                    Nuestros Productos
                </h1>
                <p className="text-slate-500 mt-2">Explora el catálogo de Northwind Traders</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                    <div key={product.product_id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                        <div className="w-full h-40 bg-slate-50 rounded-xl mb-4 flex items-center justify-center text-slate-300">
                            <Box size={60} />
                        </div>
                        
                        <h3 className="font-bold text-slate-900 text-lg mb-1 line-clamp-1">{product.product_name}</h3>
                        
                        <div className="flex items-center gap-2 text-blue-600 font-bold text-xl mb-4">
                            <Tag size={18} />
                            ${product.unit_price?.toFixed(2)}
                        </div>

                        <div className="mt-auto space-y-3">
                            <div className="flex justify-between text-xs text-slate-500 font-medium">
                                <span>Stock disponible:</span>
                                <span className={product.units_in_stock && product.units_in_stock > 0 ? "text-emerald-600" : "text-red-500"}>
                                    {product.units_in_stock || 0} unidades
                                </span>
                            </div>

                            <Button 
                                onClick={() => addToCart(product)}
                                className="w-full bg-slate-900 hover:bg-blue-600 transition-colors"
                                disabled={!product.units_in_stock || product.units_in_stock <= 0}
                            >
                                <ShoppingCart size={18} className="mr-2" />
                                Añadir al Carrito
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
