"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface BookingDetail {
  id: string;
  status: string;
  businessMessage: string | null;
  adminNotes: string | null;
  createdAt: string;
  business: {
    name: string;
    industry: string;
    location: string;
    description: string;
    user: { email: string; name: string | null };
  };
  supplier: {
    name: string;
    industry: string | null;
    location: string | null;
    website: string | null;
    description: string | null;
    contactInfo: string | null;
  };
  match: {
    matchScore: number;
    aiReasoning: string | null;
    aiSummary: string | null;
  };
}

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchBooking = useCallback(() => {
    fetch("/api/bookings")
      .then((r) => r.json())
      .then((data: BookingDetail[]) => {
        const found = data.find((b: BookingDetail) => b.id === params.id);
        if (found) {
          setBooking(found);
          setNotes(found.adminNotes || "");
        }
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  async function updateBooking(status: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: params.id, status, adminNotes: notes }),
      });
      if (!res.ok) throw new Error();
      toast.success("Booking updated");
      fetchBooking();
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function saveNotes() {
    setSaving(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: params.id,
          status: booking?.status,
          adminNotes: notes,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Notes saved");
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  if (!booking) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Booking not found.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/admin/bookings")}
        >
          Back to Bookings
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/admin/bookings"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Bookings
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Booking Request</h1>
          <p className="text-muted-foreground mt-1">
            {booking.business.name} → {booking.supplier.name}
          </p>
        </div>
        <Badge
          variant={
            booking.status === "CANCELLED" ? "destructive" : "secondary"
          }
        >
          {booking.status.replace("_", " ")}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Business</CardTitle>
            <CardDescription>{booking.business.industry}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              <span className="font-medium">Name:</span>{" "}
              {booking.business.name}
            </p>
            <p>
              <span className="font-medium">Contact:</span>{" "}
              {booking.business.user.name} ({booking.business.user.email})
            </p>
            <p>
              <span className="font-medium">Location:</span>{" "}
              {booking.business.location}
            </p>
            <Separator />
            <p className="text-sm text-muted-foreground">
              {booking.business.description}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supplier</CardTitle>
            <CardDescription>
              {booking.supplier.industry || "N/A"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              <span className="font-medium">Name:</span>{" "}
              {booking.supplier.name}
            </p>
            {booking.supplier.location && (
              <p>
                <span className="font-medium">Location:</span>{" "}
                {booking.supplier.location}
              </p>
            )}
            {booking.supplier.website && (
              <p>
                <span className="font-medium">Website:</span>{" "}
                <a
                  href={booking.supplier.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {booking.supplier.website}
                </a>
              </p>
            )}
            {booking.supplier.contactInfo && (
              <>
                <Separator />
                <p className="text-sm">{booking.supplier.contactInfo}</p>
              </>
            )}
            {booking.supplier.description && (
              <>
                <Separator />
                <p className="text-sm text-muted-foreground">
                  {booking.supplier.description}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Match Analysis</CardTitle>
          <CardDescription>
            Match Score: {Math.round(booking.match.matchScore)}/100
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {booking.match.aiSummary && (
            <div>
              <p className="text-sm font-medium mb-1">Business Needs Summary</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {booking.match.aiSummary}
              </p>
            </div>
          )}
          {booking.match.aiReasoning && (
            <div>
              <Separator className="my-3" />
              <p className="text-sm font-medium mb-1">Match Reasoning</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {booking.match.aiReasoning}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {booking.businessMessage && (
        <Card>
          <CardHeader>
            <CardTitle>Business Message</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{booking.businessMessage}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Admin Notes</CardTitle>
          <CardDescription>
            Private notes about this booking (not visible to the business)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this booking..."
            rows={4}
          />
          <Button onClick={saveNotes} disabled={saving} variant="outline">
            {saving ? "Saving..." : "Save Notes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          {booking.status === "PENDING_REVIEW" && (
            <>
              <Button onClick={() => updateBooking("APPROVED")} disabled={saving}>
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => updateBooking("CANCELLED")}
                disabled={saving}
              >
                Cancel
              </Button>
            </>
          )}
          {booking.status === "APPROVED" && (
            <Button onClick={() => updateBooking("CONNECTED")} disabled={saving}>
              Mark as Connected
            </Button>
          )}
          {booking.status === "CONNECTED" && (
            <Button onClick={() => updateBooking("COMPLETED")} disabled={saving}>
              Mark as Completed
            </Button>
          )}
          {booking.status === "COMPLETED" && (
            <p className="text-sm text-muted-foreground">
              This booking has been completed.
            </p>
          )}
          {booking.status === "CANCELLED" && (
            <p className="text-sm text-muted-foreground">
              This booking was cancelled.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
