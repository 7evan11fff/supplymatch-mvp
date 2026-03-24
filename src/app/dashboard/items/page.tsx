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
import { Plus, Trash2, Package, Sparkles, Loader2 } from "lucide-react";

interface Item {
  id: string;
  name: string;
  category: string;
  description: string | null;
  estimatedQuantity: string | null;
  purchaseFrequency: string | null;
  specifications: string | null;
}

const categories = [
  "Office Supplies",
  "Food & Beverage",
  "Packaging",
  "Raw Materials",
  "Cleaning Supplies",
  "Equipment",
  "Technology",
  "Furniture",
  "Safety / PPE",
  "Marketing / Print",
  "Other",
];

const emptyForm = {
  name: "",
  category: "",
  description: "",
  estimatedQuantity: "",
  purchaseFrequency: "",
  specifications: "",
};

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchItems = useCallback(() => {
    fetch("/api/items")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setItems(data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error();

      toast.success("Item added");
      setForm(emptyForm);
      setDialogOpen(false);
      fetchItems();
    } catch {
      toast.error("Failed to add item");
    } finally {
      setSaving(false);
    }
  }

  async function handleBulkImport() {
    if (!bulkText.trim()) return;
    setBulkLoading(true);

    try {
      const res = await fetch("/api/items/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: bulkText }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Import failed");
        return;
      }

      toast.success(`Imported ${data.count} items!`);
      setBulkText("");
      setBulkDialogOpen(false);
      fetchItems();
    } catch {
      toast.error("Failed to import items");
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/items?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Item removed");
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      toast.error("Failed to remove item");
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Purchased Items</h1>
          <p className="text-muted-foreground mt-1">
            Add the items your business frequently purchases. The more detail
            you provide, the better our AI can match you with suppliers.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBulkDialogOpen(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Single item dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Purchased Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item-name">Item Name</Label>
              <Input
                id="item-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Coffee Beans"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-category">Category</Label>
              <select
                id="item-category"
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-desc">Description</Label>
              <Textarea
                id="item-desc"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Any details about what you need..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-qty">Est. Quantity</Label>
                <Input
                  id="item-qty"
                  value={form.estimatedQuantity}
                  onChange={(e) =>
                    setForm({ ...form, estimatedQuantity: e.target.value })
                  }
                  placeholder="e.g. 50 lbs/month"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-freq">Purchase Frequency</Label>
                <Input
                  id="item-freq"
                  value={form.purchaseFrequency}
                  onChange={(e) =>
                    setForm({ ...form, purchaseFrequency: e.target.value })
                  }
                  placeholder="e.g. Weekly"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-specs">Specifications</Label>
              <Textarea
                id="item-specs"
                value={form.specifications}
                onChange={(e) =>
                  setForm({ ...form, specifications: e.target.value })
                }
                placeholder="Quality, brand preferences, certifications needed..."
                rows={2}
              />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Adding..." : "Add Item"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk import dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Bulk Import Items</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              List all the items your business purchases. Write naturally —
              our AI will parse them into structured entries with categories,
              quantities, and details.
            </p>
            <Textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={`Example:\nCoffee beans, 50 lbs per month, prefer organic fair trade\nTo-go cups and lids, 1000/week\nNapkins and paper towels\nCommercial dish soap, bulk size, monthly\nPrinter paper and toner cartridges for the office\nTrash bags, 30 gallon, weekly delivery`}
              rows={8}
              className="font-mono text-sm"
            />
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setBulkDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkImport}
                disabled={bulkLoading || !bulkText.trim()}
              >
                {bulkLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    AI is parsing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Import with AI
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading items...
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No items yet</h3>
            <p className="text-muted-foreground mt-1 mb-4">
              Add the items your business frequently purchases.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setBulkDialogOpen(true)}>
                <Sparkles className="h-4 w-4 mr-2" />
                Bulk Import
              </Button>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Item
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">{item.category}</Badge>
                      {item.purchaseFrequency && (
                        <span>{item.purchaseFrequency}</span>
                      )}
                      {item.estimatedQuantity && (
                        <span>· {item.estimatedQuantity}</span>
                      )}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              {(item.description || item.specifications) && (
                <CardContent className="pt-0">
                  {item.description && (
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                  {item.specifications && (
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">Specs:</span>{" "}
                      {item.specifications}
                    </p>
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
