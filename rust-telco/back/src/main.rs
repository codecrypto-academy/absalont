mod models;
mod db;
mod routes;

use rusqlite::Connection;
use std::sync::Mutex;

pub struct AppState {
    pub db: Mutex<Connection>,
}

#[rocket::main]
async fn main() -> Result<(), rocket::Error> {
    let db = Connection::open("northwind.db").expect("Failed to open database");
    let app_state = AppState {
        db: Mutex::new(db),
    };

    let _rocket = rocket::build()
        .mount("/", rocket::routes![
            routes::get_customers,
            routes::create_customer,
            routes::update_customer,
            routes::delete_customer,
            routes::get_customer,
            routes::get_products,
            routes::checkout,
            routes::get_dashboard_stats
        ])
        .manage(app_state)
        .configure(rocket::Config::figment()
            .merge(("port", 8001))
            .merge(("address", "0.0.0.0")))
        .launch()
        .await?;

    Ok(())
}
