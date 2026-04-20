"use server"
import { Customer, QueryParams, Product, CreateOrderRequest, DashboardStats } from './types';


export async function getCustomers(params: QueryParams = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value.toString());
    });
    
    const response = await fetch(`${process.env.API_URL}/customers?${searchParams}`);
    console.log(`${process.env.API_URL}/customers?${searchParams}`);
    return response.json();
}

export async function getCustomer(id: string) {
    const response = await fetch(`${process.env.API_URL}/customers/${id}`);
    return response.json();
}

export async function createCustomer(customer: Customer) {
    const response = await fetch(`${process.env.API_URL}/customers`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(customer),
    });
    return response.json();
}

export async function updateCustomer(id: string, customer: Customer) {
    const response = await fetch(`${process.env.API_URL}/customers/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(customer),
    });
    return response.json();
}

export async function deleteCustomer(id: string) {
    const response = await fetch(`${process.env.API_URL}/customers/${id}`, {
        method: 'DELETE',
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar el cliente');
    }
    return data;
}

export async function getProducts() {
    const response = await fetch(`${process.env.API_URL}/products`);
    return response.json();
}

export async function checkout(request: CreateOrderRequest) {
    const response = await fetch(`${process.env.API_URL}/checkout`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });
    return response.json();
}

export async function getStats(): Promise<DashboardStats> {
    const response = await fetch(`${process.env.API_URL}/stats`);
    return response.json();
}