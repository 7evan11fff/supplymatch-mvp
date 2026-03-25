import { SupplierNav } from "@/components/supplier/supplier-nav";

export default function SupplierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <SupplierNav />
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
