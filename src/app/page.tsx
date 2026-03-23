import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sparkles,
  Building2,
  ShoppingCart,
  ArrowRight,
  CheckCircle,
  Truck,
  Shield,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            SupplyMatch
          </Link>
          <div className="flex items-center gap-4">
            <Button render={<Link href="/auth/login" />} variant="ghost" nativeButton={false}>
              Sign In
            </Button>
            <Button render={<Link href="/auth/signup" />} nativeButton={false}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Find the perfect suppliers for your business
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              AI-powered supplier matching for local small businesses. Tell us
              what you need, and we&apos;ll connect you with the best suppliers
              — with a real person managing every step.
            </p>
            <div className="mt-10 flex gap-4 justify-center">
              <Button render={<Link href="/auth/signup" />} size="lg" className="text-lg px-8" nativeButton={false}>
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button render={<Link href="#how-it-works" />} size="lg" variant="outline" className="text-lg px-8" nativeButton={false}>
                How It Works
              </Button>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">1. Tell Us About You</h3>
                <p className="text-muted-foreground">
                  Create your business profile and list the items you frequently
                  purchase. The more detail, the better the match.
                </p>
              </div>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">
                  2. AI Finds Your Match
                </h3>
                <p className="text-muted-foreground">
                  Our AI analyzes your needs against hundreds of suppliers,
                  scoring each one and explaining why they&apos;re a fit.
                </p>
              </div>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <ShoppingCart className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">3. We Handle the Rest</h3>
                <p className="text-muted-foreground">
                  Click &quot;Book Supplier&quot; and our team personally
                  connects you, negotiates terms, and manages the relationship.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              Why SupplyMatch?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card>
                <CardHeader>
                  <Sparkles className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>AI-Powered Matching</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Advanced AI analyzes your specific needs and scores
                    suppliers on relevance, reliability, and fit. No more
                    guessing.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Shield className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Human-Managed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    A real person reviews every recommendation, connects you
                    with suppliers, and handles negotiations. You&apos;re never
                    alone.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Truck className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Growing Database</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Our supplier database continuously grows as our AI discovers
                    new vendors. If a supplier exists, we&apos;ll find them.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <h2 className="text-3xl font-bold">
                Built for Local Small Businesses
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-xl mx-auto">
                {[
                  "Restaurants & cafes",
                  "Retail shops",
                  "Beauty salons",
                  "Construction companies",
                  "Healthcare practices",
                  "Cleaning services",
                  "Auto repair shops",
                  "Professional services",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to find better suppliers?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Join local businesses who are saving time and money with
              AI-powered supplier matching.
            </p>
            <Button render={<Link href="/auth/signup" />} size="lg" className="text-lg px-8" nativeButton={false}>
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} SupplyMatch. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
