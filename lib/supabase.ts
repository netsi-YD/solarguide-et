import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface QuoteRequestRow {
  id: string;
  name: string;
  phone: string;
  city: string;
  daily_kwh: number;
  panel_kw: number;
  battery_kwh: number;
  estimated_cost_low: number;
  estimated_cost_high: number;
  created_at: string;
  status: string;
}

export interface QuoteRequestInsert {
  name: string;
  phone: string;
  city: string;
  daily_kwh: number;
  panel_kw: number;
  battery_kwh: number;
  estimated_cost_low: number;
  estimated_cost_high: number;
}

export interface InstallerRow {
  id: string;
  name: string;
  phone: string;
  city: string;
  verified: boolean;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Checks whether the public Supabase environment variables are configured
 * with real (non-placeholder) values.
 */
export function isSupabaseConfigured(): boolean {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes("your_supabase_url_here") &&
    !supabaseAnonKey.includes("your_supabase_anon_key_here") &&
    supabaseUrl.startsWith("http")
  );
}

let browserClient: SupabaseClient | null = null;

/**
 * Returns the public (anon) Supabase client for inserting quote requests.
 * Returns null if NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY are missing.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return browserClient;
}

/**
 * Public Supabase client instance (created lazily when configured, or using fallback placeholder URL during build).
 */
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured() ? supabaseUrl : "https://placeholder.supabase.co",
  isSupabaseConfigured() ? supabaseAnonKey : "placeholder-anon-key"
);
