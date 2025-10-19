-- Sample data for Aurora DSQL KoalaShop database
-- Run this after creating the tables with 01-create-aurora-tables.sql

-- Insert sample customers
INSERT INTO customers (id, name, email, phone, address) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'John Smith', 'john.smith@email.com', '555-0101', '123 Main St, Anytown, USA'),
('550e8400-e29b-41d4-a716-446655440002', 'Sarah Johnson', 'sarah.j@email.com', '555-0102', '456 Oak Ave, Somewhere, USA'),
('550e8400-e29b-41d4-a716-446655440003', 'Mike Wilson', 'mike.wilson@email.com', '555-0103', '789 Pine Rd, Elsewhere, USA'),
('550e8400-e29b-41d4-a716-446655440004', 'Emily Davis', 'emily.davis@email.com', '555-0104', '321 Elm St, Nowhere, USA'),
('550e8400-e29b-41d4-a716-446655440005', 'David Brown', 'david.brown@email.com', '555-0105', '654 Maple Dr, Anywhere, USA');

-- Insert sample products (smoked fish varieties)
INSERT INTO products (id, name, description, unit_price) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Smoked Salmon', 'Premium Atlantic salmon, cold-smoked with alder wood', 24.99),
('660e8400-e29b-41d4-a716-446655440002', 'Smoked Trout', 'Fresh rainbow trout, hot-smoked with apple wood', 19.99),
('660e8400-e29b-41d4-a716-446655440003', 'Smoked Mackerel', 'Atlantic mackerel, traditional hot-smoking method', 16.99),
('660e8400-e29b-41d4-a716-446655440004', 'Smoked Whitefish', 'Great Lakes whitefish, cold-smoked specialty', 22.99),
('660e8400-e29b-41d4-a716-446655440005', 'Smoked Herring', 'Norwegian herring, traditional Scandinavian style', 18.99),
('660e8400-e29b-41d4-a716-446655440006', 'Smoked Cod', 'Atlantic cod, lightly smoked with sea salt', 21.99);

-- Insert sample orders
INSERT INTO orders (id, customer_id, order_name, status) VALUES
('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'John''s Weekly Order', 'completed'),
('770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Sarah''s Special Order', 'pending'),
('770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'John''s Holiday Order', 'pending'),
('770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'Mike''s Family Pack', 'completed'),
('770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440004', 'Emily''s Party Order', 'pending');

-- Insert sample order items
INSERT INTO order_items (id, order_id, product_id, quantity, weight_oz, unit_price) VALUES
-- John's Weekly Order
('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 2, 8.0, 24.99),
('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', 1, 6.0, 19.99),

-- Sarah's Special Order
('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', 3, 10.0, 16.99),
('880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440004', 1, 12.0, 22.99),

-- John's Holiday Order
('880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', 4, 8.0, 24.99),
('880e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440005', 2, 6.0, 18.99),
('880e8400-e29b-41d4-a716-446655440007', '770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440006', 1, 10.0, 21.99),

-- Mike's Family Pack
('880e8400-e29b-41d4-a716-446655440008', '770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440002', 2, 8.0, 19.99),
('880e8400-e29b-41d4-a716-446655440009', '770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440003', 1, 12.0, 16.99),

-- Emily's Party Order
('880e8400-e29b-41d4-a716-446655440010', '770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440001', 3, 8.0, 24.99),
('880e8400-e29b-41d4-a716-446655440011', '770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440004', 2, 10.0, 22.99),
('880e8400-e29b-41d4-a716-446655440012', '770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', 1, 8.0, 18.99);

-- Update order totals (this should happen automatically via triggers, but let's verify)
UPDATE orders SET total_amount = calculate_order_total(id) WHERE id IN (
  '770e8400-e29b-41d4-a716-446655440001',
  '770e8400-e29b-41d4-a716-446655440002',
  '770e8400-e29b-41d4-a716-446655440003',
  '770e8400-e29b-41d4-a716-446655440004',
  '770e8400-e29b-41d4-a716-446655440005'
);

-- Verify the data
SELECT 
  c.name as customer_name,
  o.order_name,
  o.status,
  o.total_amount,
  COUNT(oi.id) as item_count
FROM customers c
JOIN orders o ON c.id = o.customer_id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY c.name, o.order_name, o.status, o.total_amount
ORDER BY c.name, o.created_at DESC;
