"use client"

import { useState } from "react"
import { Settings, ChevronDown } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface AdvancedSettingsProps {
  onSlippageChange?: (slippage: number) => void
  onDurationChange?: (duration: number) => void
  onSlicesChange?: (slices: number) => void
}

export function AdvancedSettings({ 
  onSlippageChange,
  onDurationChange,
  onSlicesChange
}: AdvancedSettingsProps) {
  const [slippage, setSlippage] = useState([0.5])
  const [duration, setDuration] = useState([30])
  const [slices, setSlices] = useState([6])
  const [isOpen, setIsOpen] = useState(false)

  const handleSlippageChange = (value: number[]) => {
    setSlippage(value)
    onSlippageChange?.(value[0])
  }

  const handleDurationChange = (value: number[]) => {
    setDuration(value)
    onDurationChange?.(value[0])
  }

  const handleSlicesChange = (value: number[]) => {
    setSlices(value)
    onSlicesChange?.(value[0])
  }

  return (
    <Card className="animated-border">
      <Collapsible className="z-100" open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-6 h-auto hover:bg-muted/50"
          >
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Advanced Settings</h3>
            </div>
            <ChevronDown 
              className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`} 
            />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="px-6 pb-6">
          <div className="space-y-6">
            {/* Max Slippage */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">Max Slippage</Label>
                <span className="text-sm text-muted-foreground">{slippage[0]}%</span>
              </div>
              <Slider 
                value={slippage} 
                onValueChange={handleSlippageChange}
                max={5} 
                min={0.1} 
                step={0.1} 
                className="w-full" 
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>0.1%</span>
                <span>5.0%</span>
              </div>
            </div>

            {/* TWAP Duration */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">TWAP Duration</Label>
                <span className="text-sm text-muted-foreground">{duration[0]} minutes</span>
              </div>
              <Slider 
                value={duration} 
                onValueChange={handleDurationChange}
                max={240} 
                min={5} 
                step={5} 
                className="w-full" 
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>5 min</span>
                <span>4 hours</span>
              </div>
            </div>

            {/* Number of Slices */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">Number of Slices</Label>
                <span className="text-sm text-muted-foreground">{slices[0]}</span>
              </div>
              <Slider 
                value={slices} 
                onValueChange={handleSlicesChange}
                max={20} 
                min={2} 
                step={1} 
                className="w-full" 
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>2</span>
                <span>20</span>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
