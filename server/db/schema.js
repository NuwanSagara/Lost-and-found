const schemaSql = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(10) NOT NULL CHECK (type IN ('lost', 'found')),
    title VARCHAR(120),
    description TEXT,
    category VARCHAR(60),
    location_name VARCHAR(120),
    lat DECIMAL(9,6),
    lng DECIMAL(9,6),
    location_source VARCHAR(20) DEFAULT 'manual' CHECK (location_source IN ('manual', 'device')),
    location_accuracy DECIMAL(10,2),
    location_captured_at TIMESTAMP,
    image_url TEXT,
    image_base64 TEXT,
    reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
    event_date TIMESTAMP,
    reported_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'matched', 'closed'))
);

CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lost_item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    found_item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    text_score DECIMAL(5,2),
    image_score DECIMAL(5,2),
    meta_score DECIMAL(5,2),
    final_score DECIMAL(5,2),
    label VARCHAR(30),
    text_reason TEXT,
    image_reason TEXT,
    key_matches JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
    ai_status VARCHAR(30) DEFAULT 'available',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (lost_item_id, found_item_id)
);

CREATE INDEX IF NOT EXISTS idx_items_type_status_reported_at
    ON items (type, status, reported_at DESC);

CREATE INDEX IF NOT EXISTS idx_matches_lost_item
    ON matches (lost_item_id, final_score DESC);

CREATE INDEX IF NOT EXISTS idx_matches_found_item
    ON matches (found_item_id, final_score DESC);

CREATE INDEX IF NOT EXISTS idx_matches_status
    ON matches (status, created_at DESC);
`;

module.exports = { schemaSql };
