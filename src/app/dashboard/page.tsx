export const dynamic = "force-dynamic";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, ShoppingCart, Sparkles, ArrowRight } from "lucide-react";

type DashboardBooking = Prisma.BookingRequestGetPayload<{
  include: { supplier: true };
}>;

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/login");

  const business = await prisma.business.findUnique({
    where: { userId: session.user.id },
    include: {
      _count: { select: { items: true, matches: true, bookings: true } },
    },
  });

  if (!business) {
    return (
      <div className="max-w-2xl mx-auto mt-16 text-center space-y-6">
        <Building2 className="h-16 w-16 mx-auto text-muted-foreground" />
        <h1 className="text-3xl font-bold">Set up your business profile</h1>
        <p className="text-muted-foreground text-lg">
          Tell us about your business so we can find the best suppliers for you.
        </p>
        <Button render={<Link href="/dashboard/profile" />} size="lg" nativeButton={false}>
          Get Started <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  }

  const recentBookings = await prisma.bookingRequest.findMany({
    where: { businessId: business.id },
    include: { supplier: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {business.name}</h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s an overview of your supplier matching activity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Items Tracked</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{business._count.items}</div>
            <Link
              href="/dashboard/items"
              className="text-xs text-muted-foreground hover:underline"
            >
              Manage items
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Supplier Matches
            </CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{business._count.matches}</div>
            <Link
              href="/dashboard/recommendations"
              className="text-xs text-muted-foreground hover:underline"
            >
              View recommendations
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Active Bookings
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{business._count.bookings}</div>
          </CardContent>
        </Card>
      </div>

      {recentBookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Booking Requests</CardTitle>
            <CardDescription>
              Status of your supplier connection requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentBookings.map((booking: DashboardBooking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{booking.supplier.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant={
                      booking.status === "CONNECTED"
                        ? "default"
                        : booking.status === "CANCELLED"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {booking.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!business.profileComplete && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">
              Complete your profile and add items to get AI-powered supplier
              recommendations.
            </p>
            <div className="flex gap-3 justify-center">
              <Button render={<Link href="/dashboard/profile" />} variant="outline" nativeButton={false}>
                Complete Profile
              </Button>
              <Button render={<Link href="/dashboard/items" />} nativeButton={false}>
                Add Items
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
