-- Create the orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'depositing', 'withdrawing', 'completed', 'failed', 'expired', 'cancelled')),
    
    -- Chain & Asset Information
    from_chain VARCHAR(255) NOT NULL,
    to_chain VARCHAR(255) NOT NULL,
    from_token VARCHAR(255) NOT NULL,
    to_token VARCHAR(255) NOT NULL,
    from_amount VARCHAR(255) NOT NULL,
    to_amount VARCHAR(255) NOT NULL,
    
    -- Participant Addresses
    maker_src_address VARCHAR(255),
    maker_dst_address VARCHAR(255),
    resolver_address VARCHAR(255),
    
    -- Atomic Swap Primitives
    hashlock VARCHAR(66) NOT NULL,
    salt INTEGER NOT NULL,
    order_hash VARCHAR(66) NOT NULL UNIQUE,
    signature TEXT NOT NULL,
    
    -- Escrow addresses
    escrow_src_address VARCHAR(255),
    escrow_dst_address VARCHAR(255),
    
    -- Transaction Tracking
    src_escrow_tx_hash VARCHAR(255),
    dst_escrow_tx_hash VARCHAR(255),
    src_withdraw_tx_hash VARCHAR(255),
    dst_withdraw_tx_hash VARCHAR(255),
    
    -- Secret
    secret VARCHAR(255),
    
    -- Financials & Timestamps
    relayer_fee VARCHAR(255),
    expires_at TIMESTAMP NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_resolver_address ON orders(resolver_address);
CREATE INDEX IF NOT EXISTS idx_orders_hashlock ON orders(hashlock);
CREATE INDEX IF NOT EXISTS idx_orders_order_hash ON orders(order_hash);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
