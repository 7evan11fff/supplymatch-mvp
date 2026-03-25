"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function SupplierProfilePage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({
    name: "",
    industry: "",
    location: "",
    website: "",
    contactInfo: "",
    description: "",
  });

  useEffect(() => {
    fetch("/api/supplier/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.name) {
          setForm({
            name: data.name,
            industry: data.industry ?? "",
            location: data.location ?? "",
            website: data.website ?? "",
            contactInfo: data.contactInfo ?? "",
            description: data.description ?? "",
          });
        }
      })
      .finally(() => setFetching(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/supplier/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to save");
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Company Profile</h1>
        <p className="text-muted-foreground mt-1">
          Keep your profile up to date so businesses can find and trust you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              Details about your supply business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Acme Supplies Inc."
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  placeholder="e.g. Food & Beverage"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Austin, TX"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe what your company supplies..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactInfo">Contact Information</Label>
              <Textarea
                id="contactInfo"
                value={form.contactInfo}
                onChange={(e) => setForm({ ...form, contactInfo: e.target.value })}
                placeholder="Phone, email, contact person..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading} size="lg">
            {loading ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </form>
    </div>
  );
}
