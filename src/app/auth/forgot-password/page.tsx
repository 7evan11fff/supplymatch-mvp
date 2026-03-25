"use client";

import { useState } from "react";
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
import { ArrowLeft, Copy, Check } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTempPassword(null);
    setMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setMessage(data.message);
      if (data.tempPassword) {
        setTempPassword(data.tempPassword);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function copyPassword() {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            Enter your email to receive a temporary password
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tempPassword ? (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200 text-sm p-4 rounded-md space-y-3">
                <p>{message}</p>
                <div className="flex items-center gap-2">
                  <code className="bg-green-100 dark:bg-green-900 px-3 py-1.5 rounded text-base font-mono flex-1">
                    {tempPassword}
                  </code>
                  <Button variant="outline" size="icon" onClick={copyPassword} aria-label="Copy password">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Use this to sign in, then change your password in your profile.
                </p>
              </div>
              <Link href="/auth/login">
                <Button className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                    {error}
                  </div>
                )}
                {message && !tempPassword && (
                  <div className="bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200 text-sm p-3 rounded-md">
                    {message}
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
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
              <p className="text-center text-sm text-muted-foreground mt-4">
                <Link
                  href="/auth/login"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Back to Sign In
                </Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
