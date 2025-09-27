"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, ListIcon } from "lucide-react";

interface SwapTabsProps {
  swapContent: React.ReactNode;
  ordersContent: React.ReactNode;
}

export function SwapTabs({ swapContent, ordersContent }: SwapTabsProps) {
  return (
    <Tabs defaultValue="swap" className="w-full">
      <TabsList className="grid w-[50%] mx-auto grid-cols-2 mb-6">
        <TabsTrigger value="swap" className="flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Swap
        </TabsTrigger>
        <TabsTrigger value="orders" className="flex items-center gap-2">
          <ListIcon className="w-4 h-4" />
          View Orders
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="swap" className="mt-0">
        {swapContent}
      </TabsContent>
      
      <TabsContent value="orders" className="mt-0">
        {ordersContent}
      </TabsContent>
    </Tabs>
  );
}
