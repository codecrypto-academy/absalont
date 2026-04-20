use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Customer {
    pub customer_id: String,
    pub company_name: String,
    pub contact_name: Option<String>,
    pub contact_title: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub region: Option<String>,
    pub postal_code: Option<String>,
    pub country: Option<String>,
    pub phone: Option<String>,
    pub fax: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Product {
    pub product_id: i32,
    pub product_name: String,
    pub unit_price: Option<f64>,
    pub units_in_stock: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CartItem {
    pub product_id: i32,
    pub quantity: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateOrderRequest {
    pub customer_id: String,
    pub items: Vec<CartItem>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DashboardStats {
    pub total_orders: i32,
    pub total_revenue: f64,
    pub total_customers: i32,
    pub recent_orders: Vec<OrderSummary>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OrderSummary {
    pub order_id: i32,
    pub customer_id: String,
    pub order_date: Option<String>,
    pub total_amount: f64,
}
