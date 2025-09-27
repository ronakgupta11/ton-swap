"use client"

export function ProgressSteps() {
  return (
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
  )
}
