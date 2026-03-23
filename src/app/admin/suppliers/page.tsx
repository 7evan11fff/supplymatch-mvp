"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
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
import {
  Plus,
  Search,
  CheckCircle,
  Globe,
  Trash2,
  Pencil,
  Loader2,
} from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  industry: string | null;
  location: string | null;
  website: string | null;
  contactInfo: string | null;
  description: string | null;
  categories: string[] | null;
  source: string;
  verified: boolean;
}

const emptyForm = {
  name: "",
  industry: "",
  location: "",
  website: "",
  contactInfo: "",
  description: "",
  categories: "",
  verified: false,
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchSuppliers = useCallback(() => {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    fetch(`/api/suppliers${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setSuppliers(data);
      })
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchSuppliers, 300);
    return () => clearTimeout(timer);
  }, [fetchSuppliers]);

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(supplier: Supplier) {
    setEditId(supplier.id);
    setForm({
      name: supplier.name,
      industry: supplier.industry || "",
      location: supplier.location || "",
      website: supplier.website || "",
      contactInfo: supplier.contactInfo || "",
      description: supplier.description || "",
      categories: Array.isArray(supplier.categories)
        ? supplier.categories.join(", ")
        : "",
      verified: supplier.verified,
    });
    setDialogOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...(editId && { id: editId }),
      name: form.name,
      industry: form.industry || null,
      location: form.location || null,
      website: form.website || null,
      contactInfo: form.contactInfo || null,
      description: form.description || null,
      categories: form.categories
        ? form.categories.split(",").map((c) => c.trim())
        : null,
      verified: form.verified,
    };

    try {
      const res = await fetch("/api/suppliers", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success(editId ? "Supplier updated" : "Supplier added");
      setDialogOpen(false);
      fetchSuppliers();
    } catch {
      toast.error("Failed to save supplier");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this supplier?")) return;
    try {
      const res = await fetch(`/api/suppliers?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Supplier deleted");
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
    } catch {
      toast.error("Failed to delete supplier");
    }
  }

  async function handleScrape() {
    setScraping(true);
    try {
      const res = await fetch("/api/suppliers/scrape", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Scraping complete! Found ${data.totalAdded} new suppliers.`);
      fetchSuppliers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Scraping failed"
      );
    } finally {
      setScraping(false);
    }
  }

  async function toggleVerified(id: string, current: boolean) {
    try {
      const supplier = suppliers.find((s) => s.id === id);
      if (!supplier) return;
      const res = await fetch("/api/suppliers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...supplier,
          id,
          verified: !current,
        }),
      });
      if (!res.ok) throw new Error();
      setSuppliers((prev) =>
        prev.map((s) => (s.id === id ? { ...s, verified: !current } : s))
      );
      toast.success(!current ? "Supplier verified" : "Verification removed");
    } catch {
      toast.error("Failed to update");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Suppliers</h1>
          <p className="text-muted-foreground mt-1">
            Manage the supplier database. {suppliers.length} suppliers total.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleScrape} disabled={scraping}>
            {scraping ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scraping...
              </>
            ) : (
              "Discover Suppliers"
            )}
          </Button>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editId ? "Edit Supplier" : "Add Supplier"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Industry</Label>
                    <Input
                      value={form.industry}
                      onChange={(e) =>
                        setForm({ ...form, industry: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      value={form.location}
                      onChange={(e) =>
                        setForm({ ...form, location: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    value={form.website}
                    onChange={(e) =>
                      setForm({ ...form, website: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Info</Label>
                  <Textarea
                    value={form.contactInfo}
                    onChange={(e) =>
                      setForm({ ...form, contactInfo: e.target.value })
                    }
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categories (comma-separated)</Label>
                  <Input
                    value={form.categories}
                    onChange={(e) =>
                      setForm({ ...form, categories: e.target.value })
                    }
                    placeholder="e.g. Food & Beverage, Restaurant Supplies"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="verified"
                    checked={form.verified}
                    onChange={(e) =>
                      setForm({ ...form, verified: e.target.checked })
                    }
                  />
                  <Label htmlFor="verified">Verified supplier</Label>
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? "Saving..." : editId ? "Update" : "Add Supplier"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search suppliers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-8">Loading...</p>
      ) : suppliers.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No suppliers found.
        </p>
      ) : (
        <div className="grid gap-3">
          {suppliers.map((supplier) => (
            <Card key={supplier.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {supplier.name}
                      {supplier.verified && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      {supplier.industry && <span>{supplier.industry}</span>}
                      {supplier.location && <span>· {supplier.location}</span>}
                      {supplier.website && (
                        <a
                          href={supplier.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Globe className="h-3 w-3" />
                          Website
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {supplier.source}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        toggleVerified(supplier.id, supplier.verified)
                      }
                      title={supplier.verified ? "Unverify" : "Verify"}
                    >
                      <CheckCircle
                        className={`h-4 w-4 ${supplier.verified ? "text-green-600" : "text-muted-foreground"}`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(supplier)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(supplier.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {supplier.description && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {supplier.description}
                  </p>
                  {Array.isArray(supplier.categories) &&
                    supplier.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {supplier.categories.map((cat) => (
                          <Badge
                            key={cat}
                            variant="secondary"
                            className="text-xs"
                          >
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
