"use client";

import { useEffect, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  Loader2,
  ExternalLink,
  CheckCircle,
  Globe,
  MapPin,
} from "lucide-react";

interface Match {
  id: string;
  matchScore: number;
  aiReasoning: string | null;
  aiSummary: string | null;
  status: string;
  supplier: {
    id: string;
    name: string;
    industry: string | null;
    location: string | null;
    website: string | null;
    description: string | null;
    verified: boolean;
  };
  booking?: { id: string; status: string } | null;
}

export default function RecommendationsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [bookingMatchId, setBookingMatchId] = useState<string | null>(null);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  function fetchMatches() {
    fetch("/api/business")
      .then((r) => r.json())
      .then((biz) => {
        if (!biz?.id) {
          setLoading(false);
          return;
        }
        return fetch(`/api/ai/matches?businessId=${biz.id}`);
      })
      .then((r) => r?.json())
      .then((data) => {
        if (Array.isArray(data)) setMatches(data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchMatches();
  }, []);

  async function runAnalysis() {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/ai/analyze", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Analysis failed");
        return;
      }

      toast.success(
        `Analysis complete! Found ${data.matchCount} supplier matches.`
      );
      fetchMatches();
    } catch {
      toast.error("Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleBook() {
    if (!bookingMatchId) return;
    setBookingLoading(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: bookingMatchId,
          message: bookingMessage,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Booking failed");
        return;
      }

      toast.success("Booking request sent! We'll be in touch soon.");
      setBookingMatchId(null);
      setBookingMessage("");
      fetchMatches();
    } catch {
      toast.error("Booking failed");
    } finally {
      setBookingLoading(false);
    }
  }

  function scoreColor(score: number) {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-orange-600";
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Supplier Recommendations</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered supplier matches based on your business profile and
            purchasing needs.
          </p>
        </div>
        <Button onClick={runAnalysis} disabled={analyzing} size="lg">
          {analyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              {matches.length > 0 ? "Re-analyze" : "Find Suppliers"}
            </>
          )}
        </Button>
      </div>

      {analyzing && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div>
                <p className="font-medium">AI is analyzing your business...</p>
                <p className="text-sm text-muted-foreground">
                  Reviewing your profile, matching against suppliers, and
                  discovering new options. This may take a minute.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading recommendations...
        </div>
      ) : matches.length === 0 && !analyzing ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center py-12">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No recommendations yet</h3>
            <p className="text-muted-foreground mt-1 mb-4">
              Make sure your profile is complete and you&apos;ve added items,
              then click &quot;Find Suppliers&quot; above.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {matches[0]?.aiSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  AI Business Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {matches[0].aiSummary}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {matches.map((match, idx) => (
              <Card
                key={match.id}
                className={idx === 0 ? "border-primary/30" : ""}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">
                          {match.supplier.name}
                        </CardTitle>
                        {match.supplier.verified && (
                          <Badge
                            variant="secondary"
                            className="text-xs"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                        {idx === 0 && (
                          <Badge>Top Match</Badge>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-3">
                        {match.supplier.industry && (
                          <span>{match.supplier.industry}</span>
                        )}
                        {match.supplier.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {match.supplier.location}
                          </span>
                        )}
                        {match.supplier.website && (
                          <a
                            href={match.supplier.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <Globe className="h-3 w-3" />
                            Website
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-3xl font-bold ${scoreColor(match.matchScore)}`}
                      >
                        {Math.round(match.matchScore)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Match Score
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {match.supplier.description && (
                    <p className="text-sm">{match.supplier.description}</p>
                  )}
                  <Separator />
                  {match.aiReasoning && (
                    <div>
                      <p className="text-sm font-medium mb-1">
                        AI Recommendation
                      </p>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {match.aiReasoning}
                      </p>
                    </div>
                  )}
                  <div className="flex justify-end">
                    {match.status === "BOOKED" ? (
                      <Badge variant="secondary">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Booking Requested
                      </Badge>
                    ) : (
                      <Button onClick={() => setBookingMatchId(match.id)}>
                        Book Supplier
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <Dialog
        open={!!bookingMatchId}
        onOpenChange={(open) => !open && setBookingMatchId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Supplier</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your request will be reviewed by our team, who will connect you
              with the supplier and handle all coordination.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Additional message (optional)
              </label>
              <Textarea
                value={bookingMessage}
                onChange={(e) => setBookingMessage(e.target.value)}
                placeholder="Any specific requirements or questions for the supplier..."
                rows={3}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setBookingMatchId(null)}
              >
                Cancel
              </Button>
              <Button onClick={handleBook} disabled={bookingLoading}>
                {bookingLoading ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
