"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Package, DollarSign, Clock, Loader2 } from "lucide-react";

interface SupplierStats {
  pendingQuotes: number;
  activeOrders: number;
  totalRevenue: number;
  recentOrders: Array<{
    id: string;
    status: string;
    total: number;
    createdAt: string;
    business: { name: string };
  }>;
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

export default function SupplierDashboard() {
  const [stats, setStats] = useState<SupplierStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/supplier/quotes").then((r) => r.json()),
      fetch("/api/supplier/orders").then((r) => r.json()),
    ])
      .then(([quotes, orders]) => {
        const quotesArr = Array.isArray(quotes) ? quotes : [];
        const ordersArr = Array.isArray(orders) ? orders : [];

        setStats({
          pendingQuotes: quotesArr.filter(
            (q: { status: string }) => q.status === "REQUESTED"
          ).length,
          activeOrders: ordersArr.filter(
            (o: { status: string }) =>
              o.status === "PAID" || o.status === "PROCESSING" || o.status === "SHIPPED"
          ).length,
          totalRevenue: ordersArr
            .filter((o: { status: string }) => o.status !== "CANCELLED")
            .reduce((sum: number, o: { total: number }) => sum + o.total, 0),
          recentOrders: ordersArr.slice(0, 5),
        });
      })
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Supplier Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage your quote requests, orders, and profile.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/supplier/quotes">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Pending Quotes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats?.pendingQuotes ?? 0}</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/supplier/orders">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Active Orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats?.activeOrders ?? 0}</p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatMoney(stats?.totalRevenue ?? 0)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!stats?.recentOrders?.length ? (
            <p className="text-muted-foreground text-sm py-4">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-2 border rounded-md px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{order.business.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        dateStyle: "medium",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">
                      {order.status.replace(/_/g, " ")}
                    </Badge>
                    <span className="font-semibold tabular-nums">
                      {formatMoney(order.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
