"use client";

import { useState, useEffect } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TokenCreation from "@/components/token-creation";
import TokenManagement from "@/components/token-management";
import TransactionHistory from "@/components/transaction-history";
import WalletProvider from "@/components/wallet-provider";
import dynamic from "next/dynamic";
// import { useToast } from "@/components/ui/use-toast";

export default function Home() {
  return (
    <WalletProvider>
      <SolanaApp />
    </WalletProvider>
  );
}

function SolanaApp() {
  const { publicKey, connected } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  // const { toast } = useToast();
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  useEffect(() => {
    const fetchBalance = async () => {
      if (publicKey) {
        try {
          const bal = await connection.getBalance(publicKey);
          setBalance(bal / 1000000000); // Convert lamports to SOL
        } catch (error) {
          console.error("Error fetching balance:", error);
          // toast({
          //   title: "Error",
          //   description: "Failed to fetch wallet balance",
          //   variant: "destructive",
          // });
        }
      }
    };

    if (connected) {
      fetchBalance();
    } else {
      setBalance(null);
    }
  }, [publicKey, connected, connection]);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center space-y-8">
        <h1 className="text-4xl font-bold">Solana Wallet App</h1>

        <div className="flex flex-col items-center space-y-4 w-full max-w-md">
          <div className="flex items-center justify-between w-full">
            <div>
              <WalletMultiButton className="bg-primary hover:bg-primary/90 text-white rounded-md px-4 py-2" />
            </div>
            {connected && balance !== null && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className="font-medium">{balance.toFixed(4)} SOL</p>
              </div>
            )}
          </div>

          {connected ? (
            <div className="w-full">
              <p className="text-sm text-muted-foreground mb-2">Connected as</p>
              <p className="font-mono text-sm bg-muted p-2 rounded-md overflow-x-auto">
                {publicKey?.toString()}
              </p>

              <Tabs defaultValue="create" className="w-full mt-6">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="create">Create Token</TabsTrigger>
                  <TabsTrigger value="manage">Manage Tokens</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
                <TabsContent value="create" className="mt-4">
                  <TokenCreation />
                </TabsContent>
                <TabsContent value="manage" className="mt-4">
                  <TokenManagement />
                </TabsContent>
                <TabsContent value="history" className="mt-4">
                  <TransactionHistory />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="text-center p-8 border rounded-lg bg-muted/50 w-full">
              <p className="text-lg mb-4">
                Connect your Solana wallet to get started
              </p>
              <p className="text-sm text-muted-foreground">
                Use Phantom or Sollet wallet to authenticate and manage your
                tokens
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
