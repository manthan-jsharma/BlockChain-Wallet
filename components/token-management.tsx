"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  transfer,
  TOKEN_PROGRAM_ID,
  getMint,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { useToast } from "@/components/ui/use-toast"
import { Loader2, Send } from "lucide-react";

interface TokenInfo {
  address: string;
  balance: string;
  decimals: number;
}

export default function TokenManagement() {
  const { publicKey, signTransaction } = useWallet();
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [tokenAddress, setTokenAddress] = useState("");
  //   const { toast } = useToast()

  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  useEffect(() => {
    fetchTokens();
  }, [publicKey]);

  const fetchTokens = async () => {
    if (!publicKey) return;

    setIsLoading(true);
    try {
      // This is a simplified approach - in a real app, you'd want to use a more robust method
      // to fetch all token accounts owned by the user
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );

      const tokenInfoPromises = tokenAccounts.value.map(
        async (tokenAccount) => {
          const accountInfo = tokenAccount.account.data.parsed.info;
          const mintAddress = accountInfo.mint;
          const balance = accountInfo.tokenAmount.uiAmount;

          // Get mint info to get decimals
          const mintInfo = await getMint(
            connection,
            new PublicKey(mintAddress)
          );

          return {
            address: mintAddress,
            balance: balance.toString(),
            decimals: mintInfo.decimals,
          };
        }
      );

      const tokenInfos = await Promise.all(tokenInfoPromises);
      setTokens(tokenInfos);
    } catch (error) {
      console.error("Error fetching tokens:", error);
      //   toast({
      //     title: "Error fetching tokens",
      //     description: "Failed to load your token balances",
      //     variant: "destructive",
      //   })
    } finally {
      setIsLoading(false);
    }
  };

  const addToken = async () => {
    if (!publicKey || !signTransaction) {
      //   toast({
      //     title: "Wallet not connected",
      //     description: "Please connect your wallet to add a token",
      //     variant: "destructive",
      //   })
      return;
    }

    if (!tokenAddress) {
      //   toast({
      //     title: "Missing information",
      //     description: "Please enter a token address",
      //     variant: "destructive",
      //   })
      return;
    }

    try {
      const mintPublicKey = new PublicKey(tokenAddress);

      // Get or create the associated token account
      await getOrCreateAssociatedTokenAccount(
        connection,
        {
          publicKey,
          signTransaction,
        } as any,
        mintPublicKey,
        publicKey
      );

      //   toast({
      //     title: "Token added successfully",
      //     description: "The token has been added to your wallet",
      //   })

      // Refresh token list
      fetchTokens();
      setTokenAddress("");
    } catch (error) {
      console.error("Error adding token:", error);
      //   toast({
      //     title: "Error adding token",
      //     description: error instanceof Error ? error.message : "Invalid token address",
      //     variant: "destructive",
      //   })
    }
  };

  const sendToken = async () => {
    if (!publicKey || !signTransaction || !selectedToken) {
      //   toast({
      //     title: "Error",
      //     description: "Wallet not connected or no token selected",
      //     variant: "destructive",
      //   })
      return;
    }

    if (!recipientAddress || !sendAmount) {
      //   toast({
      //     title: "Missing information",
      //     description: "Please enter recipient address and amount",
      //     variant: "destructive",
      //   })
      return;
    }

    setIsSending(true);
    try {
      const mintPublicKey = new PublicKey(selectedToken);
      const recipientPublicKey = new PublicKey(recipientAddress);

      // Find the selected token info
      const tokenInfo = tokens.find((t) => t.address === selectedToken);
      if (!tokenInfo) throw new Error("Token information not found");

      // Get the source token account
      const sourceTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        {
          publicKey,
          signTransaction,
        } as any,
        mintPublicKey,
        publicKey
      );

      // Get or create the destination token account
      const destinationTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        {
          publicKey,
          signTransaction,
        } as any,
        mintPublicKey,
        recipientPublicKey
      );

      // Calculate the amount in base units
      const amount =
        Number.parseFloat(sendAmount) * Math.pow(10, tokenInfo.decimals);

      // Send the tokens
      const signature = await transfer(
        connection,
        {
          publicKey,
          signTransaction,
        } as any,
        sourceTokenAccount.address,
        destinationTokenAccount.address,
        publicKey,
        amount
      );

      //   toast({
      //     title: "Tokens sent successfully",
      //     description: `Transaction signature: ${signature.slice(0, 10)}...`,
      //   })

      // Refresh token list
      fetchTokens();
      setRecipientAddress("");
      setSendAmount("");
    } catch (error) {
      console.error("Error sending tokens:", error);
      //   toast({
      //     title: "Error sending tokens",
      //     description: error instanceof Error ? error.message : "Unknown error occurred",
      //     variant: "destructive",
      //   })
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Tabs defaultValue="view">
      <TabsList className="grid grid-cols-3 w-full">
        <TabsTrigger value="view">My Tokens</TabsTrigger>
        <TabsTrigger value="add">Add Token</TabsTrigger>
        <TabsTrigger value="send">Send Tokens</TabsTrigger>
      </TabsList>

      <TabsContent value="view">
        <Card>
          <CardHeader>
            <CardTitle>My Tokens</CardTitle>
            <CardDescription>View your SPL token balances</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : tokens.length > 0 ? (
              <div className="space-y-2">
                {tokens.map((token) => (
                  <div
                    key={token.address}
                    className="p-3 border rounded-md flex justify-between items-center cursor-pointer hover:bg-muted"
                    onClick={() => setSelectedToken(token.address)}
                  >
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">
                        {token.address.slice(0, 8)}...{token.address.slice(-8)}
                      </p>
                      <p className="font-medium">{token.balance}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedToken(token.address);
                        document
                          .querySelector('[data-value="send"]')
                          ?.dispatchEvent(
                            new MouseEvent("click", { bubbles: true })
                          );
                      }}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No tokens found in your wallet
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={fetchTokens}
              disabled={isLoading || !publicKey}
              className="w-full"
            >
              Refresh Tokens
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="add">
        <Card>
          <CardHeader>
            <CardTitle>Add Token</CardTitle>
            <CardDescription>
              Add an existing SPL token to your wallet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tokenAddress">Token Mint Address</Label>
              <Input
                id="tokenAddress"
                placeholder="Enter SPL token address"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={addToken} disabled={!publicKey} className="w-full">
              Add Token
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="send">
        <Card>
          <CardHeader>
            <CardTitle>Send Tokens</CardTitle>
            <CardDescription>Send SPL tokens to another wallet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tokenSelect">Select Token</Label>
              <select
                id="tokenSelect"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedToken || ""}
                onChange={(e) => setSelectedToken(e.target.value)}
              >
                <option value="" disabled>
                  Select a token
                </option>
                {tokens.map((token) => (
                  <option key={token.address} value={token.address}>
                    {token.address.slice(0, 8)}...{token.address.slice(-8)} (
                    {token.balance})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipientAddress">Recipient Address</Label>
              <Input
                id="recipientAddress"
                placeholder="Enter recipient's wallet address"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sendAmount">Amount</Label>
              <Input
                id="sendAmount"
                type="number"
                placeholder="Enter amount to send"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={sendToken}
              disabled={isSending || !publicKey || !selectedToken}
              className="w-full"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Tokens"
              )}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
