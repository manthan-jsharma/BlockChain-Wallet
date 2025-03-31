"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function TokenCreation() {
  const { publicKey, signTransaction } = useWallet();
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [decimals, setDecimals] = useState("9");
  const [initialSupply, setInitialSupply] = useState("1000000");
  const [isLoading, setIsLoading] = useState(false);
  const [createdTokenAddress, setCreatedTokenAddress] = useState<string | null>(
    null
  );
  //   const {toast} = usetoast();

  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  const createToken = async () => {
    if (!publicKey || !signTransaction) {
      //   toast({
      //     title: "Wallet not connected",
      //     description: "Please connect your wallet to create a token",
      //     variant: "destructive",
      //   });
      return;
    }

    if (!tokenName || !tokenSymbol || !decimals || !initialSupply) {
      //   toast({
      //     title: "Missing information",
      //     description: "Please fill in all fields",
      //     variant: "destructive",
      //   });
      return;
    }

    setIsLoading(true);
    try {
      // Create the token mint
      const mint = await createMint(
        connection,
        {
          publicKey,
          signTransaction,
        } as any,
        publicKey, // payer
        publicKey, // mintAuthority
        publicKey, // freezeAuthority
        Number.parseInt(decimals)
      );

      // Get the token account of the wallet address, and if it does not exist, create it
      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        {
          publicKey,
          signTransaction,
        } as any,
        mint,
        publicKey
      );

      // Mint tokens to the token account
      await mintTo(
        connection,
        {
          publicKey,
          signTransaction,
        } as any,
        mint,
        tokenAccount.address,
        publicKey,
        Number.parseFloat(initialSupply) *
          Math.pow(10, Number.parseInt(decimals))
      );

      setCreatedTokenAddress(mint.toString());

      //   toast({
      //     title: "Token created successfully!",
      //     description: `Token address: ${mint.toString().slice(0, 10)}...`,
      //   });
    } catch (error) {
      console.error("Error creating token:", error);
      //   toast({
      //     title: "Error creating token",
      //     description:
      //       error instanceof Error ? error.message : "Unknown error occurred",
      //     variant: "destructive",
      //   });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Token</CardTitle>
        <CardDescription>
          Create your own SPL token on Solana devnet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tokenName">Token Name</Label>
          <Input
            id="tokenName"
            placeholder="My Token"
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tokenSymbol">Token Symbol</Label>
          <Input
            id="tokenSymbol"
            placeholder="MTK"
            value={tokenSymbol}
            onChange={(e) => setTokenSymbol(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="decimals">Decimals</Label>
          <Input
            id="decimals"
            type="number"
            placeholder="9"
            value={decimals}
            onChange={(e) => setDecimals(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="initialSupply">Initial Supply</Label>
          <Input
            id="initialSupply"
            type="number"
            placeholder="1000000"
            value={initialSupply}
            onChange={(e) => setInitialSupply(e.target.value)}
          />
        </div>

        {createdTokenAddress && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm font-medium">Token Address:</p>
            <p className="text-xs font-mono break-all">{createdTokenAddress}</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={createToken}
          disabled={isLoading || !publicKey}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Token"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
