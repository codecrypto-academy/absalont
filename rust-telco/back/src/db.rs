use rusqlite::{Connection, params};
use crate::models::{Customer, Product, CartItem, DashboardStats, OrderSummary};

pub fn fetch_customers(
    conn: &Connection,
    page: u32,
    per_page: u32,
    name_filter: Option<String>,
    order_by: Option<String>,
    order_direction: Option<String>
) -> Vec<Customer> {
    let offset = (page - 1) * per_page;
    
    let mut query = String::from(
        "SELECT CustomerID, CompanyName, ContactName, ContactTitle, Address, City, Region, PostalCode, Country, Phone, Fax FROM Customers"
    );
    
    let mut params_values: Vec<String> = vec![];
    
    if let Some(name) = name_filter {
        query.push_str(" WHERE CompanyName LIKE ?");
        params_values.push(format!("%{}%", name));
    }
    
    let order_by = order_by.unwrap_or_else(|| String::from("CompanyName"));
    let order_direction = order_direction.unwrap_or_else(|| String::from("ASC"));
    query.push_str(&format!(" ORDER BY {} {}", order_by, order_direction));
    query.push_str(&format!(" LIMIT {} OFFSET {}", per_page, offset));
    
    let mut stmt = conn.prepare(&query).unwrap();
    
    let customer_iter = stmt.query_map(
        rusqlite::params_from_iter(params_values.iter()),
        |row| {
            Ok(Customer {
                customer_id: row.get(0)?,
                company_name: row.get(1).unwrap_or_else(|_| "nulo".to_string()),
                contact_name: row.get(2)?,
                contact_title: row.get(3)?,
                address: row.get(4)?,
                city: row.get(5)?,
                region: row.get(6)?,
                postal_code: row.get(7)?,
                country: row.get(8)?,
                phone: row.get(9)?,
                fax: row.get(10)?,
            })
        }
    ).unwrap();

    customer_iter.map(|c| c.unwrap()).collect()
}

pub fn fetch_customer_by_id(conn: &Connection, id: &str) -> Option<Customer> {
    let mut stmt = conn.prepare("SELECT CustomerID, CompanyName, ContactName, ContactTitle, Address, City, Region, PostalCode, Country, Phone, Fax FROM Customers WHERE CustomerID = ?").unwrap();
    let mut rows = stmt.query_map(params![id], |row| {
        Ok(Customer {
            customer_id: row.get(0)?,
            company_name: row.get(1)?,
            contact_name: row.get(2)?,
            contact_title: row.get(3)?,
            address: row.get(4)?,
            city: row.get(5)?,
            region: row.get(6)?,
            postal_code: row.get(7)?,
            country: row.get(8)?,
            phone: row.get(9)?,
            fax: row.get(10)?,
        })
    }).unwrap();

    rows.next()?.ok()
}

pub fn insert_customer(conn: &Connection, customer: &Customer) -> Result<(), rusqlite::Error> {
    conn.execute(
        "INSERT INTO Customers (CustomerID, CompanyName, ContactName, ContactTitle, Address, City, Region, PostalCode, Country, Phone, Fax)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![
            customer.customer_id,
            customer.company_name,
            customer.contact_name,
            customer.contact_title,
            customer.address,
            customer.city,
            customer.region,
            customer.postal_code,
            customer.country,
            customer.phone,
            customer.fax,
        ],
    )?;
    Ok(())
}

pub fn update_customer(conn: &Connection, id: &str, customer: &Customer) -> Result<(), rusqlite::Error> {
    conn.execute(
        "UPDATE Customers 
         SET CompanyName = ?1, ContactName = ?2, ContactTitle = ?3, Address = ?4, City = ?5, Region = ?6, PostalCode = ?7, Country = ?8, Phone = ?9, Fax = ?10
         WHERE CustomerID = ?11",
        params![
            customer.company_name,
            customer.contact_name,
            customer.contact_title,
            customer.address,
            customer.city,
            customer.region,
            customer.postal_code,
            customer.country,
            customer.phone,
            customer.fax,
            id,
        ],
    )?;
    Ok(())
}

pub fn delete_customer(conn: &Connection, id: &str) -> Result<usize, rusqlite::Error> {
    let result = conn.execute(
        "DELETE FROM Customers WHERE CustomerID = ?1",
        params![id],
    )?;
    Ok(result)
}

pub fn fetch_products(conn: &Connection) -> Vec<Product> {
    let mut stmt = conn.prepare("SELECT ProductID, ProductName, UnitPrice, UnitsInStock FROM Products").unwrap();
    let product_iter = stmt.query_map([], |row| {
        Ok(Product {
            product_id: row.get(0)?,
            product_name: row.get(1)?,
            unit_price: row.get(2)?,
            units_in_stock: row.get(3)?,
        })
    }).unwrap();

    product_iter.map(|p| p.unwrap()).collect()
}

pub fn create_order(conn: &mut Connection, customer_id: &str, items: Vec<CartItem>) -> Result<i32, rusqlite::Error> {
    let tx = conn.transaction()?;

    // 1. Crear la cabecera del pedido
    tx.execute(
        "INSERT INTO Orders (CustomerID, OrderDate) VALUES (?1, date('now'))",
        params![customer_id],
    )?;
    let order_id: i32 = tx.last_insert_rowid() as i32;

    // 2. Crear los detalles del pedido
    for item in items {
        // Obtener el precio actual del producto
        let unit_price: f64 = tx.query_row(
            "SELECT UnitPrice FROM Products WHERE ProductID = ?1",
            params![item.product_id],
            |row| row.get(0),
        )?;

        tx.execute(
            "INSERT INTO [Order Details] (OrderID, ProductID, UnitPrice, Quantity, Discount) 
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![order_id, item.product_id, unit_price, item.quantity, 0],
        )?;
    }

    tx.commit()?;
    Ok(order_id)
}

pub fn get_dashboard_stats(conn: &Connection) -> DashboardStats {
    let total_orders: i32 = conn.query_row("SELECT COUNT(*) FROM Orders", [], |r| r.get(0)).unwrap_or(0);
    let total_revenue: f64 = conn.query_row("SELECT SUM(UnitPrice * Quantity) FROM [Order Details]", [], |r| r.get(0)).unwrap_or(0.0);
    let total_customers: i32 = conn.query_row("SELECT COUNT(*) FROM Customers", [], |r| r.get(0)).unwrap_or(0);

    let mut stmt = conn.prepare(
        "SELECT o.OrderID, o.CustomerID, o.OrderDate, SUM(od.UnitPrice * od.Quantity) as total 
         FROM Orders o 
         JOIN [Order Details] od ON o.OrderID = od.OrderID 
         GROUP BY o.OrderID 
         ORDER BY o.OrderID DESC 
         LIMIT 8"
    ).unwrap();

    let recent_orders = stmt.query_map([], |row| {
        Ok(OrderSummary {
            order_id: row.get(0)?,
            customer_id: row.get(1)?,
            order_date: row.get(2)?,
            total_amount: row.get(3)?,
        })
    }).unwrap().map(|r| r.unwrap()).collect();

    DashboardStats {
        total_orders,
        total_revenue,
        total_customers,
        recent_orders,
    }
}
