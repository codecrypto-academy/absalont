use rocket::{serde::json::Json, State, response::status::NotFound};
use crate::models::{Customer, Product, CreateOrderRequest, DashboardStats};
use crate::db;
use crate::AppState;

#[rocket::get("/products")]
pub async fn get_products(state: &State<AppState>) -> Json<Vec<Product>> {
    let conn = state.db.lock().unwrap_or_else(|e| e.into_inner());
    let products = db::fetch_products(&conn);
    Json(products)
}

#[rocket::post("/checkout", format = "json", data = "<request>")]
pub async fn checkout(state: &State<AppState>, request: Json<CreateOrderRequest>) -> Result<Json<i32>, String> {
    let mut conn = state.db.lock().unwrap_or_else(|e| e.into_inner());
    match db::create_order(&mut conn, &request.customer_id, request.items.iter().map(|i| crate::models::CartItem { product_id: i.product_id, quantity: i.quantity }).collect()) {
        Ok(order_id) => Ok(Json(order_id)),
        Err(e) => Err(format!("Error al procesar el pedido: {}", e))
    }
}

#[rocket::get("/stats")]
pub async fn get_dashboard_stats(state: &State<AppState>) -> Json<DashboardStats> {
    let conn = state.db.lock().unwrap_or_else(|e| e.into_inner());
    let stats = db::get_dashboard_stats(&conn);
    Json(stats)
}

#[rocket::get("/customers?<page>&<per_page>&<name_filter>&<order_by>&<order_direction>")]
pub async fn get_customers(
    state: &State<AppState>,
    page: Option<u32>,
    per_page: Option<u32>,
    name_filter: Option<String>,
    order_by: Option<String>,
    order_direction: Option<String>
) -> Json<Vec<Customer>> {
    let conn = state.db.lock().unwrap_or_else(|e| e.into_inner());
    let customers = db::fetch_customers(
        &conn,
        page.unwrap_or(1),
        per_page.unwrap_or(10),
        name_filter,
        order_by,
        order_direction
    );
    Json(customers)
}

#[rocket::get("/customers/<id>")]
pub async fn get_customer(state: &State<AppState>, id: String) -> Result<Json<Customer>, NotFound<String>> {
    let conn = state.db.lock().unwrap_or_else(|e| e.into_inner());
    match db::fetch_customer_by_id(&conn, &id) {
        Some(customer) => Ok(Json(customer)),
        None => Err(NotFound("Customer not found".to_string()))
    }
}

#[rocket::post("/customers", format = "json", data = "<customer>")]
pub async fn create_customer(state: &State<AppState>, customer: Json<Customer>) -> Result<Json<Customer>, String> {
    let conn = state.db.lock().unwrap_or_else(|e| e.into_inner());
    match db::insert_customer(&conn, &customer) {
        Ok(_) => Ok(customer),
        Err(e) => Err(format!("Error al crear cliente: {}", e))
    }
}

#[rocket::put("/customers/<id>", format = "json", data = "<customer>")]
pub async fn update_customer(state: &State<AppState>, id: String, customer: Json<Customer>) -> Result<Json<Customer>, String> {
    let conn = state.db.lock().unwrap_or_else(|e| e.into_inner());
    match db::update_customer(&conn, &id, &customer) {
        Ok(_) => Ok(customer),
        Err(e) => Err(format!("Error al actualizar cliente: {}", e))
    }
}

#[rocket::delete("/customers/<id>")]
pub async fn delete_customer(state: &State<AppState>, id: String) -> Result<Json<usize>, (rocket::http::Status, Json<serde_json::Value>)> {
    let conn = state.db.lock().unwrap_or_else(|e| e.into_inner());
    match db::delete_customer(&conn, &id) {
        Ok(result) => Ok(Json(result)),
        Err(e) => {
            let error_msg = format!("{}", e);
            Err((rocket::http::Status::InternalServerError, Json(serde_json::json!({ "error": error_msg }))))
        }
    }
}
