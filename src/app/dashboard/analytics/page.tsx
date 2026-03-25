"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  FileText,
  CalendarClock,
  Loader2,
} from "lucide-react";

interface Analytics {
  monthlySpend: Array<{ month: string; amount: number }>;
  topSuppliers: Array<{ name: string; total: number; count: number }>;
  quoteAcceptanceRate: number;
  totalQuotes: number;
  acceptedQuotes: number;
  upcomingRecurring: Array<{
    id: string;
    supplierName: string;
    frequency: string;
    nextDate: string;
    total: number;
  }>;
  totalOrders: number;
  totalSpend: number;
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/business")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading analytics...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Failed to load analytics.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Insights into your spending, suppliers, and order activity.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Spend
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatMoney(data.totalSpend)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Quote Accept Rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.quoteAcceptanceRate}%</p>
            <p className="text-xs text-muted-foreground">
              {data.acceptedQuotes} / {data.totalQuotes}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Active Subscriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {data.upcomingRecurring.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly spend chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Spend</CardTitle>
          <CardDescription>Last 6 months of order spending</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlySpend}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(value: number) => [formatMoney(value), "Spend"]}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top suppliers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Suppliers</CardTitle>
            <CardDescription>By total order volume</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topSuppliers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No order data yet.
              </p>
            ) : (
              <div className="space-y-3">
                {data.topSuppliers.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-4">{i + 1}.</span>
                      <span className="font-medium">{s.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {s.count} order{s.count !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <span className="font-semibold tabular-nums">
                      {formatMoney(s.total)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming recurring */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Recurring Orders</CardTitle>
            <CardDescription>Next scheduled deliveries</CardDescription>
          </CardHeader>
          <CardContent>
            {data.upcomingRecurring.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No active recurring orders.
              </p>
            ) : (
              <div className="space-y-3">
                {data.upcomingRecurring.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <p className="font-medium">{r.supplierName}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.frequency.toLowerCase()} &middot;{" "}
                        {new Date(r.nextDate).toLocaleDateString(undefined, {
                          dateStyle: "medium",
                        })}
                      </p>
                    </div>
                    <span className="font-semibold tabular-nums">
                      {formatMoney(r.total)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
