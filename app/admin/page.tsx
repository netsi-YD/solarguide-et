import * as React from "react";
import { createClient } from "@supabase/supabase-js";
import {
  ShieldAlert,
  Lock,
  LogOut,
  Inbox,
  Phone,
  MapPin,
  Sun,
  BatteryCharging,
  Zap,
} from "lucide-react";

import {
  isAdminAuthenticated,
  loginAdminAction,
  logoutAdminAction,
} from "./actions";
import type { QuoteRequestRow } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Input,
  Label,
} from "@/components/ui/input";

function formatEtb(amount: number): string {
  return new Intl.NumberFormat("en-ET", {
    maximumFractionDigits: 0,
  }).format(Math.round(Number(amount) || 0));
}

async function fetchQuoteRequestsServerSide(): Promise<{
  requests: QuoteRequestRow[];
  error: string | null;
  usingServiceRole: boolean;
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  const hasValidUrl =
    Boolean(supabaseUrl) &&
    !supabaseUrl.includes("your_supabase_url_here") &&
    supabaseUrl.startsWith("http");

  const hasServiceRole =
    Boolean(serviceRoleKey) &&
    !serviceRoleKey.includes("your_supabase_service_role_key_here");

  const hasAnonKey =
    Boolean(anonKey) && !anonKey.includes("your_supabase_anon_key_here");

  if (!hasValidUrl || (!hasServiceRole && !hasAnonKey)) {
    return {
      requests: [],
      error:
        "Supabase environment variables are not configured in .env.local yet.",
      usingServiceRole: false,
    };
  }

  const keyToUse = hasServiceRole ? serviceRoleKey : anonKey;
  const serverClient = createClient(supabaseUrl, keyToUse, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await serverClient
    .from("quote_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return {
      requests: [],
      error: error.message,
      usingServiceRole: hasServiceRole,
    };
  }

  return {
    requests: (data as QuoteRequestRow[]) ?? [],
    error: null,
    usingServiceRole: hasServiceRole,
  };
}

async function AdminContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const resolvedParams = await searchParams;
  const adminPasswordConfigured =
    Boolean(process.env.ADMIN_PASSWORD) &&
    process.env.ADMIN_PASSWORD !== "your_admin_password_here";

  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return (
      <div className="mx-auto max-w-md py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                <Lock className="size-4" />
              </span>
              <div>
                <CardTitle className="text-lg">Admin Sign In</CardTitle>
                <CardDescription>
                  Enter the server ADMIN_PASSWORD to view quote requests
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="gap-4">
            {!adminPasswordConfigured && (
              <Alert className="border-amber-300 bg-amber-50">
                <AlertTitle className="text-amber-950 text-xs font-semibold">
                  ADMIN_PASSWORD Not Set
                </AlertTitle>
                <AlertDescription className="text-amber-900 text-xs">
                  Set <code className="font-mono">ADMIN_PASSWORD</code> in{" "}
                  <code className="font-mono">.env.local</code> and restart the
                  server to enable admin sign-in.
                </AlertDescription>
              </Alert>
            )}

            {resolvedParams.error === "invalid" && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTitle className="text-red-900 text-xs font-semibold">
                  Invalid Password
                </AlertTitle>
                <AlertDescription className="text-red-800 text-xs">
                  The password you entered did not match ADMIN_PASSWORD.
                </AlertDescription>
              </Alert>
            )}

            <form action={loginAdminAction} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="admin-password">Admin Password</Label>
                <Input
                  id="admin-password"
                  name="password"
                  type="password"
                  placeholder="Enter admin password"
                  required
                  disabled={!adminPasswordConfigured}
                />
              </div>
              <Button
                type="submit"
                disabled={!adminPasswordConfigured}
                className="h-10 w-full bg-slate-900 hover:bg-slate-800 text-white"
              >
                Sign In to Admin Dashboard
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { requests, error, usingServiceRole } =
    await fetchQuoteRequestsServerSide();

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Quote Requests Admin
            </h1>
            <Badge variant="secondary">{requests.length} total</Badge>
          </div>
          <p className="text-sm text-slate-600">
            Server-rendered view of customer solar quote requests
          </p>
        </div>

        <form action={logoutAdminAction}>
          <Button type="submit" variant="outline" size="sm">
            <LogOut className="size-3.5" />
            Sign Out
          </Button>
        </form>
      </div>

      {!usingServiceRole && (
        <Alert className="border-amber-300 bg-amber-50">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="size-4.5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <AlertTitle className="text-amber-950">
                SUPABASE_SERVICE_ROLE_KEY Recommended for Server-Side Reads
              </AlertTitle>
              <AlertDescription className="text-amber-900">
                Row Level Security (RLS) blocks public{" "}
                <code className="font-mono">SELECT</code> queries on{" "}
                <code className="font-mono">quote_requests</code>. Add{" "}
                <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> to{" "}
                <code className="font-mono">.env.local</code> (server-only) so
                this page can read all rows while keeping the table locked down
                for public clients.
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTitle className="text-red-900">
            Could not load quote requests
          </AlertTitle>
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {requests.length === 0 ? (
        <Card className="py-10 text-center">
          <CardContent className="flex flex-col items-center gap-2">
            <Inbox className="size-8 text-slate-400" />
            <p className="font-medium text-sm text-slate-700">
              No quote requests found
            </p>
            <p className="text-xs text-slate-500 max-w-sm">
              Submitted quote requests from the calculator results page will
              appear here automatically.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((req) => (
            <Card key={req.id} className="border-slate-200 bg-white">
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-slate-900">
                        {req.name}
                      </span>
                      <Badge
                        variant="outline"
                        className="uppercase text-[10px]"
                      >
                        {req.status || "new"}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                        <Phone className="size-3.5 text-slate-500" />
                        {req.phone}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5 text-amber-600" />
                        {req.city}
                      </span>
                      <span className="text-slate-400">
                        {new Date(req.created_at).toLocaleString("en-ET", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-500">
                      Estimated Cost Range
                    </div>
                    <div className="font-bold text-sm text-slate-900">
                      {formatEtb(req.estimated_cost_low)} –{" "}
                      {formatEtb(req.estimated_cost_high)} ETB
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-2.5 text-xs border border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Zap className="size-3.5 text-amber-500 shrink-0" />
                    <div>
                      <div className="text-slate-500">Daily Load</div>
                      <div className="font-semibold text-slate-900">
                        {Number(req.daily_kwh).toFixed(2)} kWh
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Sun className="size-3.5 text-amber-600 shrink-0" />
                    <div>
                      <div className="text-slate-500">Solar Array</div>
                      <div className="font-semibold text-slate-900">
                        {Number(req.panel_kw).toFixed(2)} kW
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <BatteryCharging className="size-3.5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-slate-500">Battery Bank</div>
                      <div className="font-semibold text-slate-900">
                        {Number(req.battery_kwh).toFixed(2)} kWh
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <React.Suspense
      fallback={
        <div className="py-12 text-center text-sm text-slate-500">
          Loading admin dashboard...
        </div>
      }
    >
      <AdminContent searchParams={searchParams} />
    </React.Suspense>
  );
}
