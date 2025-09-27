"use client"

import { useState, useEffect, useCallback, useMemo } from "react"

interface WalletBalances {
  ethBalance: string
  tonBalance: string
  isLoading: boolean
  error: string | null
  refresh: () => void
  lastUpdated: Date | null
}

interface UseWalletBalancesOptions {
  refreshInterval?: number
  autoStart?: boolean
}

// Mock wallet balance data - replace with actual wallet integration
const mockWalletBalances = {
  eth: "2.45",
  ton: "125.50"
}

export function useWalletBalances(options: UseWalletBalancesOptions = {}): WalletBalances {
  const { refreshInterval = 30000, autoStart = true } = options
  
  const [ethBalance, setEthBalance] = useState("0.00")
  const [tonBalance, setTonBalance] = useState("0.00")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Memoized fetch function to prevent unnecessary re-renders
  const fetchBalances = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mock wallet balance fetching - replace with actual wallet integration
      // This would typically connect to MetaMask, TON Connect, etc.
      setEthBalance(mockWalletBalances.eth)
      setTonBalance(mockWalletBalances.ton)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balances')
      console.error('Error fetching wallet balances:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Memoized refresh function
  const refresh = useCallback(() => {
    fetchBalances()
  }, [fetchBalances])

  // Auto-fetch on mount and interval
  useEffect(() => {
    if (autoStart) {
      fetchBalances()
    }
  }, [autoStart, fetchBalances])

  // Set up interval for real-time updates
  useEffect(() => {
    if (!autoStart || !refreshInterval) return

    const interval = setInterval(() => {
      fetchBalances()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoStart, refreshInterval, fetchBalances])

  // Memoized return object to prevent unnecessary re-renders
  return useMemo(() => ({
    ethBalance,
    tonBalance,
    isLoading,
    error,
    refresh,
    lastUpdated
  }), [ethBalance, tonBalance, isLoading, error, refresh, lastUpdated])
}
