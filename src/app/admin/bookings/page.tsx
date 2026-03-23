"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye } from "lucide-react";

interface Booking {
  id: string;
  status: string;
  businessMessage: string | null;
  adminNotes: string | null;
  createdAt: string;
  business: {
    name: string;
    industry: string;
    user: { email: string; name: string | null };
  };
  supplier: { name: string; industry: string | null };
  match: { matchScore: number; aiReasoning: string | null };
}

const statusColors: Record<string, "default" | "secondary" | "destructive"> = {
  PENDING_REVIEW: "secondary",
  APPROVED: "default",
  CONNECTED: "default",
  COMPLETED: "default",
  CANCELLED: "destructive",
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("PENDING_REVIEW");

  const fetchBookings = useCallback(() => {
    fetch("/api/bookings")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setBookings(data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch("/api/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Booking updated to ${status.replace("_", " ")}`);
      fetchBookings();
    } catch {
      toast.error("Failed to update booking");
    }
  }

  const filtered = bookings.filter((b) =>
    tab === "ALL" ? true : b.status === tab
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Booking Requests</h1>
        <p className="text-muted-foreground mt-1">
          Review and manage supplier booking requests from businesses.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="PENDING_REVIEW">
            Pending ({bookings.filter((b) => b.status === "PENDING_REVIEW").length})
          </TabsTrigger>
          <TabsTrigger value="APPROVED">Approved</TabsTrigger>
          <TabsTrigger value="CONNECTED">Connected</TabsTrigger>
          <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
          <TabsTrigger value="ALL">All</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              No bookings in this category.
            </p>
          ) : (
            <div className="space-y-4">
              {filtered.map((booking) => (
                <Card key={booking.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {booking.business.name} → {booking.supplier.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {booking.business.user.email} ·{" "}
                          {booking.business.industry} · Match score:{" "}
                          {Math.round(booking.match.matchScore)}
                        </p>
                      </div>
                      <Badge variant={statusColors[booking.status] || "secondary"}>
                        {booking.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {booking.businessMessage && (
                      <div className="bg-muted p-3 rounded-md">
                        <p className="text-xs font-medium mb-1">
                          Business Message
                        </p>
                        <p className="text-sm">{booking.businessMessage}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/bookings/${booking.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                      </Link>
                      {booking.status === "PENDING_REVIEW" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() =>
                              updateStatus(booking.id, "APPROVED")
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              updateStatus(booking.id, "CANCELLED")
                            }
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      {booking.status === "APPROVED" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            updateStatus(booking.id, "CONNECTED")
                          }
                        >
                          Mark Connected
                        </Button>
                      )}
                      {booking.status === "CONNECTED" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            updateStatus(booking.id, "COMPLETED")
                          }
                        >
                          Mark Completed
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
