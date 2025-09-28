"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  ArrowRight, 
  Brain, 
  Eye, 
  BookOpen, 
  Github, 
  Twitter,
  Lock,

} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

// Floating particles component
const FloatingParticles = () => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([])

  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2
    }))
    setParticles(newParticles)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-1 h-1 bg-primary/30 rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 3,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

export default function UltronSwapHomepage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-foreground">
                Ultron Swap
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#docs" className="text-muted-foreground hover:text-foreground transition-colors">
                Docs
              </Link>
              <Link href="#github" className="text-muted-foreground hover:text-foreground transition-colors">
                GitHub
              </Link>
              <Link href="#app" className="text-muted-foreground hover:text-foreground transition-colors">
                App
              </Link>
              <Link href="#twitter" className="text-muted-foreground hover:text-foreground transition-colors">
                Twitter
              </Link>
            </div>
            <Link href="/connect-wallet">
              <Button className="gradient-primary text-primary-foreground hover:opacity-90 transition-opacity">
                Launch App
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <FloatingParticles />
        <div className="absolute inset-0 grid-pattern opacity-50"></div>
        
        <div className="container mx-auto px-4 py-24 relative">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-white text-sm font-medium mb-8"
            >
              <Brain className="w-4 h-4 mr-2" />
              AI-Powered Cross-Chain Swaps
            </motion.div>

            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-5xl md:text-7xl font-bold text-balance mb-6"
            >
              AI-Powered{" "}
              <span className=" bg-clip-text text-orange-400 gradient-primary">
                Cross Chain Swaps
              </span>
            </motion.h1>

            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-xl text-muted-foreground text-balance mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              Execute smart, secure, and oracle-verified cross-chain swaps — inspired by 1inch Fusion+, powered by AI TWAP planning.
            </motion.p>

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex z-99 flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            >   
               <Link href="/connect-wallet">
                <Button
                  size="lg"
                  variant="outline"
                  
                  className="border-border hover:bg-accent bg-transparent"
                >  
                  Try Demo
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                </Link>
            </motion.div>

            {/* Stats */}

          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" className="py-24 bg-muted/20">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4 text-balance">Why Ultron Swap?</h2>
            <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
              Advanced AI algorithms and oracle-verified pricing ensure optimal execution across any chain pair.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Brain,
                title: "AI TWAP Slicing",
                description: "Ultron's AI decides the number, size, and timing of each trade slice for optimal execution."
              },
              {
                icon: Lock,
                title: "Cross-Chain Atomicity",
                description: "HTLC secrets ensure swaps settle atomically across any chain pair."
              },
              {
                icon: Eye,
                title: "Oracle Fair Pricing",
                description: "Pyth oracles validate every swap rate to guarantee fairness."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="p-8 animated-border hover:glow-secondary transition-all duration-300">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4 text-balance">How It Works</h2>
            <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
              Simple steps to execute your first AI-powered cross-chain swap.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                step: "1️⃣",
                title: "Sign Intent",
                description: "Connect your wallet and specify your swap parameters."
              },
              {
                step: "2️⃣",
                title: "AI Plans TWAP",
                description: "Our AI analyzes market conditions and creates an optimal execution strategy."
              },
              {
                step: "3️⃣",
                title: "Resolvers Compete",
                description: "Multiple resolvers compete to execute your swap at the best rate."
              },
              {
                step: "4️⃣",
                title: "Funds Lock via HTLC",
                description: "Your funds are securely locked using Hash Time Locked Contracts."
              },
              {
                step: "5️⃣",
                title: "Relayer Verifies",
                description: "Our relayer verifies the swap conditions and oracle prices."
              },
              {
                step: "6️⃣",
                title: "Atomic Settlement",
                description: "The swap settles atomically across both chains simultaneously."
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto mb-6">
                  <span className="text-primary font-bold text-lg">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-6">Powered by Industry Leaders</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Built on the most trusted protocols and oracles in the ecosystem.
            </p>
          </motion.div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center items-center gap-12 max-w-6xl mx-auto"
          >
            {[
              { name: "1inch", icon: "1️⃣" },
              { name: "Pyth Network", icon: "🔮" },
              { name: "Ethereum", icon: "⟠" },
              { name: "TON", icon: "💎" }
            ].map((tech, index) => (
              <div key={index} className="flex flex-col items-center group">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                  <span className="text-2xl">{tech.icon}</span>
                </div>
                <span className="text-muted-foreground font-medium">{tech.name}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-4xl font-bold mb-6 text-balance">
              Start your first AI-powered cross-chain swap
            </h2>
            <p className="text-xl text-muted-foreground mb-8 text-balance">
              Join the future of DeFi with intelligent, oracle-verified cross-chain swaps.
            </p>
            <Link href="/connect-wallet">
              <Button
                size="lg"
                className="gradient-primary text-primary-foreground hover:opacity-90 transition-opacity glow-primary"
              >
                <Brain className="w-5 h-5 mr-2" />
                Launch App
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-foreground">
                Ultron Swap
              </span>
            </div>
            <div className="flex items-center space-x-8 mb-4 md:mb-0">
              <Link href="#docs" className="text-muted-foreground hover:text-foreground transition-colors">
                Docs
              </Link>
              <Link href="#github" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="w-5 h-5" />
              </Link>
              <Link href="#twitter" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="w-5 h-5" />
              </Link>
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </Link>
            </div>
            <div className="text-muted-foreground">© Ultron Swap 2025</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
