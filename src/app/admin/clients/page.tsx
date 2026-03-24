"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  KeyRound,
  Mail,
  Building2,
  MapPin,
  ShoppingCart,
  Sparkles,
  ClipboardList,
  Trash2,
  Eye,
  EyeOff,
  Copy,
} from "lucide-react";

interface Client {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  business: {
    id: string;
    name: string;
    industry: string;
    location: string;
    profileComplete: boolean;
    itemCount: number;
    matchCount: number;
    bookingCount: number;
  } | null;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

  const fetchClients = useCallback(() => {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    fetch(`/api/admin/clients${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setClients(data);
      })
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchClients, 300);
    return () => clearTimeout(timer);
  }, [fetchClients]);

  function openResetDialog(client: Client) {
    setSelectedClient(client);
    setNewPassword("");
    setShowPassword(false);
    setResetDialogOpen(true);
  }

  function generatePassword() {
    const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let pw = "";
    for (let i = 0; i < 12; i++) {
      pw += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pw);
    setShowPassword(true);
  }

  async function handleReset() {
    if (!selectedClient || !newPassword) return;
    setResetting(true);

    try {
      const res = await fetch("/api/admin/clients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedClient.id,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Reset failed");
        return;
      }

      toast.success(
        `Password reset for ${selectedClient.email}. Make sure to share the new password with them.`
      );
      setResetDialogOpen(false);
    } catch {
      toast.error("Failed to reset password");
    } finally {
      setResetting(false);
    }
  }

  async function handleDelete(client: Client) {
    const label = client.business?.name || client.email;
    if (!confirm(`Delete client "${label}" and all their data? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/clients?id=${client.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success(`Client "${label}" deleted`);
      setClients((prev) => prev.filter((c) => c.id !== client.id));
    } catch {
      toast.error("Failed to delete client");
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Clients</h1>
        <p className="text-muted-foreground mt-1">
          View client accounts, emails, and reset passwords.{" "}
          {clients.length} registered clients.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or business..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-8">Loading...</p>
      ) : clients.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          {search ? "No clients match your search." : "No clients registered yet."}
        </p>
      ) : (
        <div className="grid gap-4">
          {clients.map((client) => (
            <Card key={client.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {client.business?.name || client.name || "No Profile"}
                      {client.business?.profileComplete ? (
                        <Badge variant="secondary" className="text-xs">
                          Profile Complete
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs opacity-60">
                          Incomplete
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1 space-y-1">
                      <span className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {client.email}
                        <button
                          onClick={() => copyToClipboard(client.email)}
                          className="text-muted-foreground hover:text-foreground"
                          title="Copy email"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </span>
                      {client.business && (
                        <span className="flex items-center gap-3 text-xs">
                          {client.business.industry && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {client.business.industry}
                            </span>
                          )}
                          {client.business.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {client.business.location}
                            </span>
                          )}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openResetDialog(client)}
                    >
                      <KeyRound className="h-3 w-3 mr-1" />
                      Reset Password
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(client)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {client.business && (
                <CardContent className="pt-0">
                  <Separator className="mb-3" />
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ShoppingCart className="h-3.5 w-3.5" />
                      {client.business.itemCount} items
                    </span>
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      {client.business.matchCount} matches
                    </span>
                    <span className="flex items-center gap-1">
                      <ClipboardList className="h-3.5 w-3.5" />
                      {client.business.bookingCount} bookings
                    </span>
                    <span className="ml-auto text-xs">
                      Joined {new Date(client.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium">
                  {selectedClient.business?.name || selectedClient.name || "Client"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedClient.email}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 8 chars)"
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generatePassword}
                  >
                    Generate
                  </Button>
                </div>
              </div>

              {newPassword && showPassword && (
                <div className="flex items-center gap-2 bg-muted p-3 rounded-md">
                  <code className="flex-1 text-sm font-mono">{newPassword}</code>
                  <button
                    onClick={() => copyToClipboard(newPassword)}
                    className="text-muted-foreground hover:text-foreground"
                    title="Copy password"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                After resetting, share the new password with the client securely.
                They can use it to log in immediately.
              </p>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setResetDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReset}
                  disabled={resetting || newPassword.length < 8}
                >
                  {resetting ? "Resetting..." : "Reset Password"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
