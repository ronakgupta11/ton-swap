import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, ArrowUpDown, Settings, Zap, TrendingUp, Clock, ArrowRight, Info } from "lucide-react"
import Link from "next/link"
import { SwapTabs } from "@/components/swap-tabs"
import { ViewOrders } from "@/components/view-orders"

export default function SetSwapPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
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
              <span className="text-xl font-bold text-foreground">SwapAI</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Configure Your Swap</h1>
            <p className="text-muted-foreground">
              Set your swap parameters and let AI optimize the execution strategy.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  ✓
                </div>
                <span className="ml-2 text-sm text-primary">Connected</span>
              </div>
              <div className="w-8 h-px bg-primary"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <span className="ml-2 text-sm font-medium text-primary">Set Swap</span>
              </div>
            </div>
          </div>

          <SwapTabs
            swapContent={
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Swap Configuration */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Swap Interface */}
                  <Card className="p-6 animated-border">
                    <div className="space-y-6">
                      {/* From Token */}
                      <div>
                        <Label className="text-sm font-medium mb-3 block">From</Label>
                        <div className="flex items-center space-x-4">
                          <Select defaultValue="eth">
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="eth">
                                <div className="flex items-center space-x-2">
                                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                                  <span>ETH</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="usdc">
                                <div className="flex items-center space-x-2">
                                  <div className="w-4 h-4 rounded-full bg-blue-600"></div>
                                  <span>USDC</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Input placeholder="0.0" className="flex-1 text-right text-lg font-medium" defaultValue="1.5" />
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground mt-2">
                          <span>Ethereum Network</span>
                          <span>Balance: 2.45 ETH</span>
                        </div>
                      </div>

                      {/* Swap Direction */}
                      <div className="flex justify-center">
                        <Button variant="outline" size="sm" className="rounded-full w-10 h-10 p-0 bg-transparent">
                          <ArrowUpDown className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* To Token */}
                      <div>
                        <Label className="text-sm font-medium mb-3 block">To</Label>
                        <div className="flex items-center space-x-4">
                          <Select defaultValue="ton">
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ton">
                                <div className="flex items-center space-x-2">
                                  <div className="w-4 h-4 rounded-full bg-blue-400"></div>
                                  <span>TON</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="usdt">
                                <div className="flex items-center space-x-2">
                                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                                  <span>USDT</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="0.0"
                            className="flex-1 text-right text-lg font-medium bg-muted/20"
                            value="~847.5"
                            readOnly
                          />
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground mt-2">
                          <span>TON Network</span>
                          <span>Balance: 125.50 TON</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Advanced Settings */}
                  <Card className="p-6 animated-border">
                    <div className="flex items-center space-x-2 mb-6">
                      <Settings className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">Advanced Settings</h3>
                    </div>

                    <div className="space-y-6">
                      {/* Max Slippage */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-medium">Max Slippage</Label>
                          <span className="text-sm text-muted-foreground">0.5%</span>
                        </div>
                        <Slider defaultValue={[0.5]} max={5} min={0.1} step={0.1} className="w-full" />
                        <div className="flex justify-between text-xs text-muted-foreground mt-2">
                          <span>0.1%</span>
                          <span>5.0%</span>
                        </div>
                      </div>

                      {/* TWAP Duration */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-medium">TWAP Duration</Label>
                          <span className="text-sm text-muted-foreground">30 minutes</span>
                        </div>
                        <Slider defaultValue={[30]} max={240} min={5} step={5} className="w-full" />
                        <div className="flex justify-between text-xs text-muted-foreground mt-2">
                          <span>5 min</span>
                          <span>4 hours</span>
                        </div>
                      </div>

                      {/* Number of Slices */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-medium">Number of Slices</Label>
                          <span className="text-sm text-muted-foreground">6</span>
                        </div>
                        <Slider defaultValue={[6]} max={20} min={2} step={1} className="w-full" />
                        <div className="flex justify-between text-xs text-muted-foreground mt-2">
                          <span>2</span>
                          <span>20</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* AI Suggestions Panel */}
                <div className="space-y-6">
                  <Card className="p-6 animated-border">
                    <div className="flex items-center space-x-2 mb-6">
                      <Zap className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">AI Suggestions</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="flex items-center space-x-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium text-primary">Optimal Strategy</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Based on current market conditions, we recommend 6 slices over 30 minutes for minimal slippage.
                        </p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>Expected Slippage:</span>
                            <span className="text-primary">0.12%</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Estimated Fees:</span>
                            <span>$12.50</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Price Impact:</span>
                            <span className="text-primary">-0.08%</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-muted/20 border border-border/40">
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Market Analysis</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          ETH/TON pair showing low volatility. Good time for TWAP execution.
                        </p>
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-xs text-green-400">Low volatility detected</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-muted/20 border border-border/40">
                        <div className="flex items-center space-x-2 mb-2">
                          <Info className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Network Status</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>Ethereum Gas:</span>
                            <span className="text-yellow-400">Medium (25 gwei)</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>TON Network:</span>
                            <span className="text-green-400">Fast</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Preview Button */}
                  <Button
                    size="lg"
                    className="w-full gradient-primary text-primary-foreground hover:opacity-90 transition-opacity glow-primary"
                  >
                    Preview TWAP Plan
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>

                  {/* Quick Stats */}
                  <Card className="p-4">
                    <h4 className="text-sm font-medium mb-3">Execution Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Amount:</span>
                        <span>1.5 ETH</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Expected Output:</span>
                        <span>~847.5 TON</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Duration:</span>
                        <span>30 minutes</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Slices:</span>
                        <span>6 × 0.25 ETH</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            }
            ordersContent={<ViewOrders />}
          />
        </div>
      </div>
    </div>
  )
}
