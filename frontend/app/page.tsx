import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowRight, Zap, Shield, TrendingUp, Wallet, ArrowUpDown, Clock } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <ArrowUpDown className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">SwapAI</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                How it Works
              </Link>
              <Link href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
                About
              </Link>
            </div>
            <Link href="/connect-wallet">
              <Button className="gradient-primary text-primary-foreground hover:opacity-90 transition-opacity">
                Launch App
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-50"></div>
        <div className="container mx-auto px-4 py-24 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
              <Zap className="w-4 h-4 mr-2" />
              AI-Powered Cross-Chain Swaps
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-balance mb-6">
              Smart cross-chain swaps{" "}
              <span className="text-transparent bg-clip-text gradient-primary">executed over time</span> for optimal
              price and yield
            </h1>

            <p className="text-xl text-muted-foreground text-balance mb-12 max-w-2xl mx-auto leading-relaxed">
              AI-powered TWAP swaps between Ethereum and TON that reduce slippage and maximize efficiency through
              intelligent execution strategies.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link href="/connect-wallet">
                <Button
                  size="lg"
                  className="gradient-primary text-primary-foreground hover:opacity-90 transition-opacity glow-primary"
                >
                  <Wallet className="w-5 h-5 mr-2" />
                  Connect Wallet
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-border hover:bg-accent bg-transparent">
                <Clock className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">$2.4M+</div>
                <div className="text-sm text-muted-foreground">Volume Swapped</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">0.15%</div>
                <div className="text-sm text-muted-foreground">Average Slippage</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">1,200+</div>
                <div className="text-sm text-muted-foreground">Successful Swaps</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-balance">Why Choose SwapAI?</h2>
            <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
              Advanced AI algorithms optimize your cross-chain swaps for better prices and lower fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="p-8 animated-border hover:glow-secondary transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">AI-Powered Optimization</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our AI analyzes real-time market data, liquidity, and network fees to execute your swaps at the optimal
                times and prices.
              </p>
            </Card>

            <Card className="p-8 animated-border hover:glow-secondary transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Reduced Slippage</h3>
              <p className="text-muted-foreground leading-relaxed">
                TWAP (Time-Weighted Average Price) execution breaks large orders into smaller chunks, minimizing market
                impact and slippage.
              </p>
            </Card>

            <Card className="p-8 animated-border hover:glow-secondary transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Cross-Chain Efficiency</h3>
              <p className="text-muted-foreground leading-relaxed">
                Seamlessly swap between Ethereum and TON networks with optimized routing and minimal fees through
                Fusion+ integration.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-balance">How It Works</h2>
            <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
              Simple steps to start optimizing your cross-chain swaps with AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                step: "01",
                title: "Connect Wallets",
                description: "Connect your MetaMask and TON wallets to access both networks.",
              },
              {
                step: "02",
                title: "Configure Swap",
                description: "Set your source and destination tokens, amounts, and preferences.",
              },
              {
                step: "03",
                title: "AI Optimization",
                description: "Our AI calculates the optimal TWAP strategy for your swap.",
              },
              {
                step: "04",
                title: "Execute & Monitor",
                description: "Watch your swap execute over time with real-time updates.",
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto mb-6">
                  <span className="text-primary font-bold text-lg">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6 text-balance">Ready to optimize your swaps?</h2>
            <p className="text-xl text-muted-foreground mb-8 text-balance">
              Join thousands of users who are already saving on fees and getting better prices with SwapAI.
            </p>
            <Link href="/connect-wallet">
              <Button
                size="lg"
                className="gradient-primary text-primary-foreground hover:opacity-90 transition-opacity glow-primary"
              >
                <Wallet className="w-5 h-5 mr-2" />
                Get Started Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <ArrowUpDown className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">SwapAI</span>
            </div>
            <div className="text-sm text-muted-foreground">© 2025 SwapAI. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
