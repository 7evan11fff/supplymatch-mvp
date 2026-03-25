"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

const industries = [
  "Restaurant / Food Service",
  "Retail",
  "Construction",
  "Healthcare",
  "Manufacturing",
  "Professional Services",
  "Beauty / Salon",
  "Auto Repair",
  "Cleaning Services",
  "Technology",
  "Agriculture",
  "Other",
];

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isNewProfile, setIsNewProfile] = useState(true);
  const [form, setForm] = useState({
    name: "",
    industry: "",
    location: "",
    description: "",
    operatingDetails: {
      employeeCount: "",
      yearsInBusiness: "",
      monthlyBudget: "",
    },
  });

  useEffect(() => {
    fetch("/api/business")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.name) {
          setIsNewProfile(false);
          setForm({
            name: data.name,
            industry: data.industry,
            location: data.location,
            description: data.description,
            operatingDetails: data.operatingDetails || {
              employeeCount: "",
              yearsInBusiness: "",
              monthlyBudget: "",
            },
          });
        }
      })
      .finally(() => setFetching(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast.success("Business profile saved!");
      if (isNewProfile) {
        router.push("/dashboard/items");
      }
      router.refresh();
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Business Profile</h1>
        <p className="text-muted-foreground mt-1">
          Tell us about your business so our AI can find the best suppliers.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Core details about your business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Business Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Acme Coffee Shop"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <select
                id="industry"
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                <option value="">Select an industry</option>
                {industries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Austin, TX"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Business Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Describe what your business does, what you sell, and who your customers are..."
                rows={4}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operating Details</CardTitle>
            <CardDescription>
              Helps us find suppliers that match your scale
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employees">Number of Employees</Label>
                <Input
                  id="employees"
                  value={form.operatingDetails.employeeCount}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      operatingDetails: {
                        ...form.operatingDetails,
                        employeeCount: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g. 5-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="years">Years in Business</Label>
                <Input
                  id="years"
                  value={form.operatingDetails.yearsInBusiness}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      operatingDetails: {
                        ...form.operatingDetails,
                        yearsInBusiness: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g. 3"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Monthly Supply Budget</Label>
                <Input
                  id="budget"
                  value={form.operatingDetails.monthlyBudget}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      operatingDetails: {
                        ...form.operatingDetails,
                        monthlyBudget: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g. $2,000-$5,000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading} size="lg">
            {loading ? "Saving..." : isNewProfile ? "Save & Continue to Items" : "Save Profile"}
          </Button>
        </div>
      </form>
    </div>
  );
}
