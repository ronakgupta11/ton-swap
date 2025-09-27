import { useState, useEffect, useCallback } from 'react';
import { HermesClient } from '@pythnetwork/hermes-client';

import type { 
  PriceData, 
  UsePythPricesOptions, 
  UsePythPricesReturn, 
  UseEthTonRatioReturn, 
  UseTokenPricesReturn 
} from '../types/pyth';

// Price feed IDs for different tokens
const PRICE_FEED_IDS = {
  ETH_USD: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
  TON_USD: "0x8963217838ab4cf5cadc172203c1f0b763fbaa45f346d8ee50ba994bbcac3026",
} as const;

export function usePythPrices(options: UsePythPricesOptions = {}): UsePythPricesReturn {
  const {
    refreshInterval = 30000, // 30 seconds default
    autoStart = true
  } = options;

  const [priceData, setPriceData] = useState<PriceData>({
    ethUsd: 0,
    tonUsd: 0,
    ethTonRatio: 0,
    lastUpdated: new Date(),
    isLoading: false,
    error: null,
  });

  const [connection] = useState(() => {
    try {
      return new HermesClient("https://hermes.pyth.network", {});
    } catch (error) {
      console.error('Failed to initialize Hermes client:', error);
      throw error;
    }
  });

  const fetchPrices = useCallback(async () => {
    setPriceData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('Starting price fetch...');
      
      // Try multiple approaches to get prices
      let ethUsd = 0;
      let tonUsd = 0;
      let success = false;

      // Approach 1: Try getLatestPriceUpdates with primary IDs
      try {
        console.log('Trying getLatestPriceUpdates with primary IDs...');
        const priceIds = [PRICE_FEED_IDS.ETH_USD, PRICE_FEED_IDS.TON_USD];
        const priceUpdates = await connection.getLatestPriceUpdates(priceIds);
         console.log('getLatestPriceUpdates response:', priceUpdates.parsed);
         const priceUpdatesParsed = priceUpdates?.parsed||[];
         if (priceUpdatesParsed && Array.isArray(priceUpdatesParsed) && priceUpdatesParsed.length >= 2) {
           // Parse ETH price with correct decimal handling
           const ethPriceData = priceUpdatesParsed[0]?.price;
           console.log('ETH price data:', ethPriceData);
           if (ethPriceData && ethPriceData.price && ethPriceData.expo !== undefined) {
             ethUsd = Number(ethPriceData.price) / Math.pow(10, -ethPriceData.expo);
             console.log(`ETH: raw=${ethPriceData.price}, expo=${ethPriceData.expo}, calculated=${ethUsd}`);
           }
           
           // Parse TON price with correct decimal handling
           const tonPriceData = priceUpdatesParsed[1]?.price;
           console.log('TON price data:', tonPriceData);
           if (tonPriceData && tonPriceData.price && tonPriceData.expo !== undefined) {
             tonUsd = Number(tonPriceData.price) / Math.pow(10, -tonPriceData.expo);
             console.log(`TON: raw=${tonPriceData.price}, expo=${tonPriceData.expo}, calculated=${tonUsd}`);
           }
          if (ethUsd > 0 && tonUsd > 0) {
            success = true;
            console.log('✓ Primary approach successful');
          }
        }
      } catch (error) {
        console.log('Primary approach failed:', error);
      }

        // Approach 2: Try getPriceFeeds as fallback
        if (!success) {
          try {
            console.log('Trying getPriceFeeds as fallback...');
            const ethFeeds = await connection.getPriceFeeds({
              query: "eth",
              assetType: "crypto",
            });
            const tonFeeds = await connection.getPriceFeeds({
              query: "ton",
              assetType: "crypto",
            });
            console.log('ETH feeds:', ethFeeds);
            console.log('TON feeds:', tonFeeds);
            
            // This approach is more complex and may not work as expected
            // Keeping it as fallback but not implementing full parsing
            console.log('getPriceFeeds approach not fully implemented - using as fallback only');
          } catch (error) {
            console.log('getPriceFeeds approach failed:', error);
          }
        }

      if (!success) {
        throw new Error('All price fetching methods failed. Please check your internet connection and try again.');
      }

      console.log('Final parsed prices - ETH:', ethUsd, 'TON:', tonUsd);
      
      const ethTonRatio = ethUsd / tonUsd;

      setPriceData({
        ethUsd,
        tonUsd,
        ethTonRatio,
        lastUpdated: new Date(),
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching Pyth prices:', error);
      setPriceData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }));
    }
  }, [connection]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchPrices();
  }, [fetchPrices]);

  // Set up interval for automatic updates
  useEffect(() => {
    if (!autoStart) return;

    // Initial fetch
    fetchPrices();

    // Set up interval for periodic updates
    const interval = setInterval(fetchPrices, refreshInterval);
    return () => clearInterval(interval);
  }, [autoStart, fetchPrices, refreshInterval]);

  // Cleanup connection on unmount
  useEffect(() => {
    return () => {
      // Connection cleanup if needed
    };
  }, []);

  return {
    ...priceData,
    refresh,
  };
}

// Hook for just ETH/TON ratio
export function useEthTonRatio(options: UsePythPricesOptions = {}): UseEthTonRatioReturn {
  const { ethTonRatio, isLoading, error, refresh, lastUpdated } = usePythPrices(options);
  
  return {
    ratio: ethTonRatio,
    isLoading,
    error,
    refresh,
    lastUpdated,
  };
}

// Hook for individual token prices
export function useTokenPrices(options: UsePythPricesOptions = {}): UseTokenPricesReturn {
  const { ethUsd, tonUsd, isLoading, error, refresh, lastUpdated } = usePythPrices(options);
  
  return {
    ethUsd,
    tonUsd,
    isLoading,
    error,
    refresh,
    lastUpdated,
  };
}
