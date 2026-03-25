"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const isSupplier = roleParam === "supplier";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const body: Record<string, string> = { email, password, name };
      if (isSupplier) {
        body.role = "SUPPLIER";
        body.companyName = companyName;
      }

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but login failed. Please try logging in.");
        setLoading(false);
        return;
      }

      if (isSupplier) {
        router.push("/supplier");
      } else {
        router.push("/dashboard/profile");
      }
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {isSupplier ? "Register as a Supplier" : "Create your account"}
          </CardTitle>
          <CardDescription>
            {isSupplier
              ? "Join SupplyMatch to receive quote requests and manage orders"
              : "Get matched with the best suppliers for your business"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Jane Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            {isSupplier && (
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Acme Supplies Inc."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@business.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
          <div className="text-center text-sm text-muted-foreground mt-4 space-y-2">
            <p>
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
            {!isSupplier && (
              <p>
                Are you a supplier?{" "}
                <Link
                  href="/auth/signup?role=supplier"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Register as supplier
                </Link>
              </p>
            )}
            {isSupplier && (
              <p>
                Looking to buy?{" "}
                <Link
                  href="/auth/signup"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Register as a business
                </Link>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
