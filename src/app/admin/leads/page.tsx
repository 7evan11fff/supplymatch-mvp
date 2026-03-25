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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Plus,
  Globe,
  Phone,
  Mail,
  MapPin,
  Building2,
  Users,
  UserRound,
  Crown,
  Copy,
  Trash2,
  Pencil,
  ExternalLink,
  Database,
  Store,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Lead {
  id: string;
  businessName: string;
  website: string | null;
  industry: string;
  isFranchise: boolean;
  locationCount: number;
  address: string | null;
  city: string;
  state: string;
  zip: string | null;
  generalPhone: string | null;
  generalEmail: string | null;
  managerName: string | null;
  managerEmail: string | null;
  managerPhone: string | null;
  ceoName: string | null;
  ceoEmail: string | null;
  ceoPhone: string | null;
  additionalContacts: string | null;
  notes: string | null;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

const EMPTY_FORM: Omit<Lead, "id" | "createdAt" | "updatedAt"> = {
  businessName: "",
  website: "",
  industry: "",
  isFranchise: false,
  locationCount: 1,
  address: "",
  city: "Austin",
  state: "TX",
  zip: "",
  generalPhone: "",
  generalEmail: "",
  managerName: "",
  managerEmail: "",
  managerPhone: "",
  ceoName: "",
  ceoEmail: "",
  ceoPhone: "",
  additionalContacts: "",
  notes: "",
  status: "PROSPECT",
  priority: "MEDIUM",
};

const STATUS_OPTIONS = [
  { value: "PROSPECT", label: "Prospect", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { value: "CONTACTED", label: "Contacted", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  { value: "NEGOTIATING", label: "Negotiating", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  { value: "CONVERTED", label: "Converted", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "LOST", label: "Lost", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
];

const PRIORITY_OPTIONS = [
  { value: "HIGH", label: "High", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  { value: "MEDIUM", label: "Medium", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  { value: "LOW", label: "Low", color: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200" },
];

function StatusBadge({ status }: { status: string }) {
  const opt = STATUS_OPTIONS.find((s) => s.value === status);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${opt?.color ?? ""}`}>
      {opt?.label ?? status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const opt = PRIORITY_OPTIONS.find((p) => p.value === priority);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${opt?.color ?? ""}`}>
      {opt?.label ?? priority}
    </span>
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLeads = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    const qs = params.toString();
    fetch(`/api/admin/leads${qs ? `?${qs}` : ""}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setLeads(data);
      })
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchLeads, 300);
    return () => clearTimeout(timer);
  }, [fetchLeads]);

  function openCreate() {
    setEditingLead(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(lead: Lead) {
    setEditingLead(lead);
    setForm({
      businessName: lead.businessName,
      website: lead.website ?? "",
      industry: lead.industry,
      isFranchise: lead.isFranchise,
      locationCount: lead.locationCount,
      address: lead.address ?? "",
      city: lead.city,
      state: lead.state,
      zip: lead.zip ?? "",
      generalPhone: lead.generalPhone ?? "",
      generalEmail: lead.generalEmail ?? "",
      managerName: lead.managerName ?? "",
      managerEmail: lead.managerEmail ?? "",
      managerPhone: lead.managerPhone ?? "",
      ceoName: lead.ceoName ?? "",
      ceoEmail: lead.ceoEmail ?? "",
      ceoPhone: lead.ceoPhone ?? "",
      additionalContacts: lead.additionalContacts ?? "",
      notes: lead.notes ?? "",
      status: lead.status,
      priority: lead.priority,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.businessName || !form.industry) {
      toast.error("Business name and industry are required");
      return;
    }
    setSaving(true);
    try {
      const method = editingLead ? "PUT" : "POST";
      const body = editingLead ? { id: editingLead.id, ...form } : form;
      const res = await fetch("/api/admin/leads", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast.success(editingLead ? "Lead updated" : "Lead created");
      setDialogOpen(false);
      fetchLeads();
    } catch {
      toast.error("Failed to save lead");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(lead: Lead) {
    if (!confirm(`Delete lead "${lead.businessName}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/leads?id=${lead.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success(`"${lead.businessName}" deleted`);
      setLeads((prev) => prev.filter((l) => l.id !== lead.id));
    } catch {
      toast.error("Failed to delete lead");
    }
  }

  async function handleStatusChange(lead: Lead, newStatus: string) {
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id, status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, status: newStatus } : l))
      );
      toast.success(`Status updated to ${STATUS_OPTIONS.find((s) => s.value === newStatus)?.label}`);
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function handleSeed() {
    if (!confirm("Seed the database with 9 Austin-area B2B leads? This only works if no leads exist yet.")) return;
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/leads/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || data.error || "Seed failed");
        return;
      }
      toast.success(data.message);
      fetchLeads();
    } catch {
      toast.error("Failed to seed leads");
    } finally {
      setSeeding(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  const stats = {
    total: leads.length,
    prospect: leads.filter((l) => l.status === "PROSPECT").length,
    contacted: leads.filter((l) => l.status === "CONTACTED").length,
    negotiating: leads.filter((l) => l.status === "NEGOTIATING").length,
    converted: leads.filter((l) => l.status === "CONVERTED").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">B2B Leads</h1>
          <p className="text-muted-foreground mt-1">
            Local Austin-area businesses to acquire as customers. {stats.total} leads tracked.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSeed} disabled={seeding}>
            <Database className="h-4 w-4 mr-2" />
            {seeding ? "Seeding..." : "Seed Austin Leads"}
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Prospect", value: stats.prospect, color: "text-blue-600" },
          { label: "Contacted", value: stats.contacted, color: "text-yellow-600" },
          { label: "Negotiating", value: stats.negotiating, color: "text-purple-600" },
          { label: "Converted", value: stats.converted, color: "text-green-600" },
        ].map((s) => (
          <Card key={s.label} className="py-3">
            <CardContent className="p-0 px-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by business, industry, name, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "ALL")}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lead Cards */}
      {loading ? (
        <p className="text-muted-foreground text-center py-8">Loading...</p>
      ) : leads.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Store className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              {search || statusFilter !== "ALL"
                ? "No leads match your filters."
                : "No leads yet. Click \"Seed Austin Leads\" to load initial data or add leads manually."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {leads.map((lead) => {
            const isExpanded = expandedId === lead.id;
            return (
              <Card key={lead.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-lg">{lead.businessName}</CardTitle>
                        <StatusBadge status={lead.status} />
                        <PriorityBadge priority={lead.priority} />
                        {lead.isFranchise && (
                          <Badge variant="secondary" className="text-xs">Franchise</Badge>
                        )}
                      </div>
                      <CardDescription className="mt-1.5 space-y-1">
                        <span className="flex items-center gap-3 flex-wrap text-sm">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {lead.industry}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {lead.city}, {lead.state} {lead.zip}
                          </span>
                          <span className="flex items-center gap-1">
                            <Store className="h-3 w-3" />
                            {lead.locationCount} location{lead.locationCount !== 1 ? "s" : ""}
                          </span>
                        </span>
                        {lead.website && (
                          <span className="flex items-center gap-1 text-sm">
                            <Globe className="h-3 w-3" />
                            <a
                              href={lead.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              {lead.website.replace(/^https?:\/\/(www\.)?/, "")}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-4">
                      <Select
                        value={lead.status}
                        onValueChange={(v) => v && handleStatusChange(lead, v)}
                      >
                        <SelectTrigger className="h-8 text-xs w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(lead)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(lead)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Separator className="mb-3" />
                  {/* Contact summary row */}
                  <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
                    {lead.ceoName && (
                      <span className="flex items-center gap-1.5">
                        <Crown className="h-3.5 w-3.5 text-amber-500" />
                        <span className="font-medium text-foreground">{lead.ceoName}</span>
                        <span className="text-xs">(CEO)</span>
                      </span>
                    )}
                    {lead.managerName && (
                      <span className="flex items-center gap-1.5">
                        <UserRound className="h-3.5 w-3.5 text-blue-500" />
                        <span className="font-medium text-foreground">{lead.managerName}</span>
                        <span className="text-xs">(Manager)</span>
                      </span>
                    )}
                    {lead.generalPhone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {lead.generalPhone}
                        <button onClick={() => copyToClipboard(lead.generalPhone!)} className="hover:text-foreground">
                          <Copy className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {lead.generalEmail && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {lead.generalEmail}
                        <button onClick={() => copyToClipboard(lead.generalEmail!)} className="hover:text-foreground">
                          <Copy className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                  </div>

                  {/* Expand / collapse */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                    className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {isExpanded ? "Hide details" : "Show full contact details"}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {/* CEO Contact */}
                      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <h4 className="font-semibold flex items-center gap-1.5">
                          <Crown className="h-4 w-4 text-amber-500" /> CEO / Owner
                        </h4>
                        {lead.ceoName ? (
                          <>
                            <p>{lead.ceoName}</p>
                            {lead.ceoEmail && (
                              <p className="flex items-center gap-1.5 text-muted-foreground">
                                <Mail className="h-3 w-3" /> {lead.ceoEmail}
                                <button onClick={() => copyToClipboard(lead.ceoEmail!)} className="hover:text-foreground">
                                  <Copy className="h-3 w-3" />
                                </button>
                              </p>
                            )}
                            {lead.ceoPhone && (
                              <p className="flex items-center gap-1.5 text-muted-foreground">
                                <Phone className="h-3 w-3" /> {lead.ceoPhone}
                                <button onClick={() => copyToClipboard(lead.ceoPhone!)} className="hover:text-foreground">
                                  <Copy className="h-3 w-3" />
                                </button>
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-muted-foreground italic">No CEO info on file</p>
                        )}
                      </div>

                      {/* Manager Contact */}
                      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <h4 className="font-semibold flex items-center gap-1.5">
                          <UserRound className="h-4 w-4 text-blue-500" /> Manager
                        </h4>
                        {lead.managerName ? (
                          <>
                            <p>{lead.managerName}</p>
                            {lead.managerEmail && (
                              <p className="flex items-center gap-1.5 text-muted-foreground">
                                <Mail className="h-3 w-3" /> {lead.managerEmail}
                                <button onClick={() => copyToClipboard(lead.managerEmail!)} className="hover:text-foreground">
                                  <Copy className="h-3 w-3" />
                                </button>
                              </p>
                            )}
                            {lead.managerPhone && (
                              <p className="flex items-center gap-1.5 text-muted-foreground">
                                <Phone className="h-3 w-3" /> {lead.managerPhone}
                                <button onClick={() => copyToClipboard(lead.managerPhone!)} className="hover:text-foreground">
                                  <Copy className="h-3 w-3" />
                                </button>
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-muted-foreground italic">No manager info on file</p>
                        )}
                      </div>

                      {/* Location */}
                      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <h4 className="font-semibold flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-green-500" /> Location
                        </h4>
                        {lead.address && <p>{lead.address}</p>}
                        <p>{lead.city}, {lead.state} {lead.zip}</p>
                        <p className="text-muted-foreground">
                          {lead.locationCount} location{lead.locationCount !== 1 ? "s" : ""}
                          {lead.isFranchise ? " (Franchise)" : " (Independent)"}
                        </p>
                      </div>

                      {/* General Contact */}
                      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <h4 className="font-semibold flex items-center gap-1.5">
                          <Phone className="h-4 w-4 text-violet-500" /> General Contact
                        </h4>
                        {lead.generalPhone && (
                          <p className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-muted-foreground" /> {lead.generalPhone}
                          </p>
                        )}
                        {lead.generalEmail && (
                          <p className="flex items-center gap-1.5">
                            <Mail className="h-3 w-3 text-muted-foreground" /> {lead.generalEmail}
                          </p>
                        )}
                        {lead.website && (
                          <p className="flex items-center gap-1.5">
                            <Globe className="h-3 w-3 text-muted-foreground" />
                            <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              {lead.website.replace(/^https?:\/\/(www\.)?/, "")}
                            </a>
                          </p>
                        )}
                      </div>

                      {/* Additional Contacts */}
                      {lead.additionalContacts && (
                        <div className="md:col-span-2 bg-muted/50 rounded-lg p-3 space-y-2">
                          <h4 className="font-semibold flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-cyan-500" /> Additional Contacts & Locations
                          </h4>
                          <p className="text-muted-foreground whitespace-pre-wrap text-xs leading-relaxed">
                            {lead.additionalContacts}
                          </p>
                        </div>
                      )}

                      {/* Notes */}
                      {lead.notes && (
                        <div className="md:col-span-2 bg-muted/50 rounded-lg p-3 space-y-2">
                          <h4 className="font-semibold">Notes</h4>
                          <p className="text-muted-foreground whitespace-pre-wrap text-xs leading-relaxed">
                            {lead.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLead ? "Edit Lead" : "Add New Lead"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Business Info */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Business Information</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    placeholder="e.g. Houndstooth Coffee"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="industry">Industry *</Label>
                  <Input
                    id="industry"
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    placeholder="e.g. Specialty Coffee"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={form.website ?? ""}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="locationCount">Number of Locations</Label>
                  <Input
                    id="locationCount"
                    type="number"
                    min={1}
                    value={form.locationCount}
                    onChange={(e) => setForm({ ...form, locationCount: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Franchise?</Label>
                  <Select
                    value={form.isFranchise ? "yes" : "no"}
                    onValueChange={(v) => setForm({ ...form, isFranchise: v === "yes" })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No — Independent</SelectItem>
                      <SelectItem value="yes">Yes — Franchise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Location */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Location</h3>
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-4 space-y-1">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={form.address ?? ""}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Street address"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="zip">ZIP</Label>
                  <Input
                    id="zip"
                    value={form.zip ?? ""}
                    onChange={(e) => setForm({ ...form, zip: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* General Contact */}
            <div>
              <h3 className="text-sm font-semibold mb-3">General Contact</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="generalPhone">Phone</Label>
                  <Input
                    id="generalPhone"
                    value={form.generalPhone ?? ""}
                    onChange={(e) => setForm({ ...form, generalPhone: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="generalEmail">Email</Label>
                  <Input
                    id="generalEmail"
                    value={form.generalEmail ?? ""}
                    onChange={(e) => setForm({ ...form, generalEmail: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Manager */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Manager</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="managerName">Name</Label>
                  <Input
                    id="managerName"
                    value={form.managerName ?? ""}
                    onChange={(e) => setForm({ ...form, managerName: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="managerEmail">Email</Label>
                  <Input
                    id="managerEmail"
                    value={form.managerEmail ?? ""}
                    onChange={(e) => setForm({ ...form, managerEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="managerPhone">Phone</Label>
                  <Input
                    id="managerPhone"
                    value={form.managerPhone ?? ""}
                    onChange={(e) => setForm({ ...form, managerPhone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* CEO */}
            <div>
              <h3 className="text-sm font-semibold mb-3">CEO / Owner</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="ceoName">Name</Label>
                  <Input
                    id="ceoName"
                    value={form.ceoName ?? ""}
                    onChange={(e) => setForm({ ...form, ceoName: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ceoEmail">Email</Label>
                  <Input
                    id="ceoEmail"
                    value={form.ceoEmail ?? ""}
                    onChange={(e) => setForm({ ...form, ceoEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ceoPhone">Phone</Label>
                  <Input
                    id="ceoPhone"
                    value={form.ceoPhone ?? ""}
                    onChange={(e) => setForm({ ...form, ceoPhone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Additional + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v ?? form.status })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v ?? form.priority })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="additionalContacts">Additional Contacts</Label>
              <Textarea
                id="additionalContacts"
                value={form.additionalContacts ?? ""}
                onChange={(e) => setForm({ ...form, additionalContacts: e.target.value })}
                rows={3}
                placeholder="Other contacts, location details, etc."
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes ?? ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                placeholder="Internal notes about this lead..."
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : editingLead ? "Update Lead" : "Create Lead"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
