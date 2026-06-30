export type DriverStatus = 'AVAILABLE' | 'EN_ROUTE' | 'ON_SCENE' | 'OFF_DUTY' | 'TOWING';

export interface Driver {
  id: string;
  name: string;
  callsign: string;
  phone: string;
  vehicle_type: string;
  status: DriverStatus;
  current_location_lat: number;
  current_location_lng: number;
  current_location_address: string;
  active_incident_id?: string | null;
  rating: number;
  completed_dispatches: number;
}

export interface Incident {
  id: string;
  case_number: string;
  signal_code: string;
  description: string;
  raw_transcript_id?: string;
  location_address: string;
  location_lat: number;
  location_lng: number;
  vehicles_involved: number;
  injuries_reported: boolean;
  hazmat_or_blocking: boolean;
  severity: 'CRITICAL' | 'MAJOR' | 'MODERATE' | 'MINOR';
  status: 'UNASSIGNED' | 'DISPATCHED' | 'ON_SCENE' | 'RECOVERY_IN_PROGRESS' | 'CLEARED';
  assigned_driver_id?: string | null;
  driver_name?: string;
  driver_callsign?: string;
  dispatched_at?: string;
  eta_minutes?: number;
  distance_miles?: number;
  route_coordinates?: [number, number][];
  notes: string[];
  autonomous_dispatch: boolean;
  created_at: string;
  updated_at: string;
}

export interface VonageConfig {
  apiKey: string;
  apiSecret: string;
  fromNumber: string;
  fromWhatsApp: string;
  channel: 'sms' | 'whatsapp';
  mode: 'SANDBOX' | 'LIVE_API';
}

export interface VonageLog {
  id: string;
  timestamp: string;
  to_phone: string;
  driver_name: string;
  message: string;
  status: string;
  sid: string;
  channel_used: 'sms' | 'whatsapp';
  api_response?: string;
}

export interface RadioCall {
  id: string;
  timestamp: string;
  agency: string;
  unit: string;
  transcript: string;
  audio_duration_seconds: number;
  audio_url?: string;
  is_signal4: boolean;
  ai_analysis?: any;
  detected_keywords: string[];
  confidence: number;
  linked_incident_id?: string;
  created_at: string;
}

export interface RangecastConfig {
  feedUrl: string;
  feedName: string;
  mode: 'SIMULATED_AI_SYNTH' | 'LIVE_EMBED' | 'BROWSER_MIC';
  activeFilter: 'ALL' | 'ONLY_SIGNAL_4' | 'NO_ROUTINE';
  autoDispatchEnabled: boolean;
  autoDispatchRadiusMiles: number;
}

export interface DashboardStats {
  incidents: {
    total_incidents: string;
    cleared: string;
    dispatched: string;
    unassigned: string;
    critical: string;
    today_count: string;
  };
  drivers: {
    total_drivers: string;
    available: string;
    en_route: string;
    on_scene: string;
    off_duty: string;
  };
  radio: {
    total_calls: string;
    signal4_calls: string;
    today_calls: string;
  };
  recentActivity: any[];
}
