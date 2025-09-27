"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";

export function WalletConnect() {
  const [tonConnected, setTonConnected] = useState(false);
  const [tonAddress, setTonAddress] = useState("");

  // TON Connect hooks
  const [tonConnectUI] = useTonConnectUI();
  const tonWallet = useTonWallet();

  // Update wallet state when connection changes
  useEffect(() => {
    const connected = !!tonWallet;
    const address = tonWallet?.account?.address || "";

    setTonConnected(connected);
    setTonAddress(address);

    // Log wallet connection to console
    if (tonWallet) {
      console.log("TON Wallet Connected:", {
        address: tonWallet.account?.address,
        device: tonWallet.device?.appName,
        provider: tonWallet.provider,
      });
    }
  }, [tonWallet]);

  const handleDisconnect = () => {
    if (tonWallet) {
      tonConnectUI.disconnect();
    }
  };

  return (
    <div className="flex items-center gap-2 z-50">
      {!tonConnected ? (
        <Button
          onClick={() => tonConnectUI.openModal()}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          CONNECT TON
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <Badge className="bg-green-500/20 text-green-400">
            TON CONNECTED
          </Badge>
          <span className="text-xs text-muted-foreground">
            {tonAddress.slice(0, 6)}...{tonAddress.slice(-4)}
          </span>
          <Button
            onClick={handleDisconnect}
            variant="outline"
            size="sm"
            className="text-foreground border-destructive hover:bg-destructive/10"
          >
            DISCONNECT
          </Button>
        </div>
      )}
    </div>
  );
}
