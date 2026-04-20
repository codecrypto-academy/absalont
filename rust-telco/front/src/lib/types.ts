export interface Customer {
    customer_id: string;
    company_name: string;
    contact_name?: string;
    contact_title?: string;
    address?: string;
    city?: string;
    region?: string;
    postal_code?: string;
    country?: string;
    phone?: string;
    fax?: string;
}

export interface Product {
    product_id: number;
    product_name: string;
    unit_price?: number;
    units_in_stock?: number;
}

export interface CartItem {
    product_id: number;
    product_name: string;
    unit_price: number;
    quantity: number;
}

export interface CreateOrderRequest {
    customer_id: string;
    items: {
        product_id: number;
        quantity: number;
    }[];
}

export interface DashboardStats {
    total_orders: number;
    total_revenue: number;
    total_customers: number;
    recent_orders: OrderSummary[];
}

export interface OrderSummary {
    order_id: number;
    customer_id: string;
    order_date?: string;
    total_amount: number;
}

export interface QueryParams {
    page?: number;
    per_page?: number;
    name_filter?: string;
    order_by?: string;
    order_direction?: string;
}