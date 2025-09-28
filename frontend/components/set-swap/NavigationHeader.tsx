"use client"

import { ArrowLeft, ArrowUpDown } from "lucide-react"
import Link from "next/link"

export function NavigationHeader() {
  return (
    <nav className="border-b border-border/40 backdrop-blur-sm bg-background/80">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/connect-wallet" className="flex items-center space-x-2">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            <span className="text-muted-foreground hover:text-foreground transition-colors">Back</span>
          </Link>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <ArrowUpDown className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Ultron Swap</span>
          </div>
        </div>
      </div>
    </nav>
  )
}
