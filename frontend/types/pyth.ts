export interface PythPriceData {
  price: string;
  conf: string;
  expo: number;
  publish_time: number;
}

export interface PythPriceUpdate {
  id: string;
  price: PythPriceData;
  [key: string]: unknown;
}

export interface PriceData {
  ethUsd: number;
  tonUsd: number;
  ethTonRatio: number;
  lastUpdated: Date;
  isLoading: boolean;
  error: string | null;
}

export interface UsePythPricesOptions {
  refreshInterval?: number; // in milliseconds
  autoStart?: boolean; // whether to start fetching immediately
}

export interface UsePythPricesReturn extends PriceData {
  refresh: () => void;
}

export interface UseEthTonRatioReturn {
  ratio: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  lastUpdated: Date;
}

export interface UseTokenPricesReturn {
  ethUsd: number;
  tonUsd: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  lastUpdated: Date;
}

