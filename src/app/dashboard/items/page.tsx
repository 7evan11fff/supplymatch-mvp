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
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Package, Sparkles, Loader2, Pencil } from "lucide-react";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [bulkText, setBulkText] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

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

  function openAdd() {
    setEditingItem(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(item: Item) {
    setEditingItem(item);
    setForm({
      name: item.name,
      category: item.category,
      description: item.description ?? "",
      estimatedQuantity: item.estimatedQuantity ?? "",
      purchaseFrequency: item.purchaseFrequency ?? "",
      specifications: item.specifications ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const method = editingItem ? "PUT" : "POST";
      const body = editingItem ? { id: editingItem.id, ...form } : form;
      const res = await fetch("/api/items", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error();

      toast.success(editingItem ? "Item updated" : "Item added");
      setForm(emptyForm);
      setEditingItem(null);
      setDialogOpen(false);
      fetchItems();
    } catch {
      toast.error(editingItem ? "Failed to update item" : "Failed to add item");
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

  function confirmDelete(item: Item) {
    setDeleteTarget(item);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/items?id=${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Item removed");
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
    } catch {
      toast.error("Failed to remove item");
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item" : "Add Purchased Item"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
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
              {saving ? "Saving..." : editingItem ? "Update Item" : "Add Item"}
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

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
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
              <Button onClick={openAdd}>
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
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(item)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={`Edit ${item.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => confirmDelete(item)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Delete ${item.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
