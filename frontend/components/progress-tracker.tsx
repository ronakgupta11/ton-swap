"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface ProgressStep {
  id: number;
  title: string;
  subtitle?: string;
  status: "completed" | "current" | "pending";
}

interface ProgressTrackerProps {
  steps: ProgressStep[];
  onCompleteStep?: (stepId: number) => void;
}

export function ProgressTracker({ steps, onCompleteStep }: ProgressTrackerProps) {
  return (
    <div className="bg-slate-900 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-6">Progress</h3>
      
      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start space-x-4">
            {/* Progress Line */}
            <div className="flex flex-col items-center">
              {/* Step Icon */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step.status === "completed"
                    ? "bg-green-500 text-white"
                    : step.status === "current"
                    ? "bg-orange-500 text-white"
                    : "bg-orange-500 text-white"
                }`}
              >
                {step.status === "completed" ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  step.id
                )}
              </div>
              
              {/* Vertical Line */}
              {index < steps.length - 1 && (
                <div
                  className={`w-0.5 h-12 mt-2 ${
                    step.status === "completed" ? "bg-green-500" : "bg-gray-600"
                  }`}
                />
              )}
            </div>
            
            {/* Step Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h4
                    className={`text-sm font-medium ${
                      step.status === "completed"
                        ? "text-green-400"
                        : step.status === "current"
                        ? "text-orange-400"
                        : "text-orange-400"
                    }`}
                  >
                    {step.title}
                  </h4>
                  {step.subtitle && (
                    <p className="text-xs text-gray-400 mt-1">{step.subtitle}</p>
                  )}
                </div>
                
                {/* Complete Step Button */}
                {(step.status === "current" || step.status === "pending") && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                    onClick={() => onCompleteStep?.(step.id)}
                  >
                    Complete Step
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
