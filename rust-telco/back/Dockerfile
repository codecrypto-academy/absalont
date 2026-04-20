# Stage 1: Builder
FROM rust:1.75-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache musl-dev

# Copy Cargo files
COPY Cargo.toml Cargo.lock ./

# Copy source code
COPY src ./src

# Build the application in release mode
RUN cargo build --release

# Stage 2: Runtime
FROM alpine:latest

WORKDIR /app

# Install runtime dependencies (Rust runtime is not needed, only the binary)
RUN apk add --no-cache ca-certificates wget

# Copy the binary from builder
COPY --from=builder /app/target/release/proyecto-web /app/proyecto-web

# Copy the database file
COPY northwind.db /app/northwind.db

# Expose the port
EXPOSE 8001

# Run the application
CMD ["./proyecto-web"]

