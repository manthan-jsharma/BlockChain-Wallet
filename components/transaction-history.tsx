"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink } from "lucide-react";

interface Transaction {
  signature: string;
  blockTime: number;
  slot: number;
  type: string;
}

export default function TransactionHistory() {
  const { publicKey } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  //   const { toast } = useToast();

  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  useEffect(() => {
    if (publicKey) {
      fetchTransactions();
    }
  }, [publicKey]);

  const fetchTransactions = async () => {
    if (!publicKey) return;

    setIsLoading(true);
    try {
      const signatures = await connection.getSignaturesForAddress(publicKey, {
        limit: 10,
      });

      const txPromises = signatures.map(async (sig) => {
        const tx = await connection.getTransaction(sig.signature);
        return {
          signature: sig.signature,
          blockTime: sig.blockTime || 0,
          slot: sig.slot,
          type: tx?.meta?.logMessages?.some((log) => log.includes("Transfer"))
            ? "Transfer"
            : tx?.meta?.logMessages?.some((log) =>
                log.includes("CreateAccount")
              )
            ? "Create Account"
            : "Other",
        };
      });

      const txs = await Promise.all(txPromises);
      setTransactions(txs);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      //   toast({
      //     title: "Error fetching transactions",
      //     description: "Failed to load your transaction history",
      //     variant: "destructive",
      //   });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "Unknown";
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>
          View your recent transactions on Solana devnet
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.signature} className="p-3 border rounded-md">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{tx.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(tx.blockTime)}
                    </p>
                  </div>
                  <a
                    href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center text-xs"
                  >
                    View <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </div>
                <p className="font-mono text-xs mt-2 break-all">
                  {tx.signature}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">
            {publicKey
              ? "No transactions found"
              : "Connect your wallet to view transactions"}
          </p>
        )}

        {publicKey && (
          <Button
            onClick={fetchTransactions}
            disabled={isLoading}
            variant="outline"
            className="w-full mt-4"
          >
            Refresh Transactions
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
