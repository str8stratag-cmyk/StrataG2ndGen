-- StrataG2ndGen Database Schema
-- PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for admin/auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'dispatcher',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drivers table (tow truck operators)
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    callsign VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    vehicle_type VARCHAR(100) DEFAULT 'Tow Truck',
    status VARCHAR(50) DEFAULT 'AVAILABLE',
    current_location_lat DECIMAL(10, 8),
    current_location_lng DECIMAL(11, 8),
    current_location_address TEXT,
    active_incident_id UUID,
    rating DECIMAL(3, 2) DEFAULT 5.0,
    completed_dispatches INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Incidents table (Signal 4 / emergency calls)
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_number VARCHAR(100) UNIQUE NOT NULL,
    signal_code VARCHAR(100),
    description TEXT,
    raw_transcript_id UUID,
    location_address TEXT NOT NULL,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    vehicles_involved INTEGER DEFAULT 0,
    injuries_reported BOOLEAN DEFAULT FALSE,
    hazmat_or_blocking BOOLEAN DEFAULT FALSE,
    severity VARCHAR(50) DEFAULT 'MAJOR',
    status VARCHAR(50) DEFAULT 'UNASSIGNED',
    assigned_driver_id UUID,
    dispatched_at TIMESTAMP WITH TIME ZONE,
    eta_minutes INTEGER,
    distance_miles DECIMAL(5, 2),
    route_coordinates JSONB,
    notes TEXT[] DEFAULT '{}',
    autonomous_dispatch BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Radio calls table (transcribed scanner audio)
CREATE TABLE IF NOT EXISTS radio_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    agency VARCHAR(100) DEFAULT 'HCSO',
    unit VARCHAR(100),
    transcript TEXT NOT NULL,
    audio_duration_seconds DECIMAL(6, 2) DEFAULT 0,
    audio_url TEXT,
    is_signal4 BOOLEAN DEFAULT FALSE,
    ai_analysis JSONB,
    detected_keywords TEXT[] DEFAULT '{}',
    confidence DECIMAL(3, 2) DEFAULT 0.6,
    linked_incident_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vonage logs (SMS/WhatsApp history)
CREATE TABLE IF NOT EXISTS vonage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    to_phone VARCHAR(20) NOT NULL,
    driver_name VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'SENT',
    channel VARCHAR(20) DEFAULT 'sms',
    message_id VARCHAR(255),
    api_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_assigned_driver ON incidents(assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_radio_calls_timestamp ON radio_calls(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_radio_calls_signal4 ON radio_calls(is_signal4);
CREATE INDEX IF NOT EXISTS idx_vonage_logs_timestamp ON vonage_logs(timestamp DESC);

-- Foreign key constraints
ALTER TABLE incidents
    ADD CONSTRAINT fk_incidents_driver
    FOREIGN KEY (assigned_driver_id) REFERENCES drivers(id) ON DELETE SET NULL;

ALTER TABLE radio_calls
    ADD CONSTRAINT fk_radio_calls_incident
    FOREIGN KEY (linked_incident_id) REFERENCES incidents(id) ON DELETE SET NULL;
