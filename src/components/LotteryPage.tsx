"use client";

import { useEffect, useState } from "react";
import { useCurrentAccount } from "@iota/dapp-kit";
import { useContract } from "../hooks/useContract";
import { Button, Heading, Text, TextField } from "@radix-ui/themes";
import ClipLoader from "react-spinners/ClipLoader";

const LotteryIntegration = () => {
  const currentAccount = useCurrentAccount();

  const {
    data,
    luckyNumber,
    actions,
    state,
    lotteryBoxId,
    winnerId,
    isWinner,
  } = useContract();

  const [ticketNumber, setTicketNumber] = useState("0");
  const [spinningNumber, setSpinningNumber] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [canDraw, setCanDraw] = useState(true);

  useEffect(() => {
    if (luckyNumber !== null) {
      actions.checkWinner();
      setCanDraw(false);
    }
  }, [luckyNumber]);

  const startSpin = () => {
    setIsSpinning(true);

    const interval = setInterval(() => {
      setSpinningNumber(Math.floor(Math.random() * 100));
    }, 50);

    setTimeout(() => {
      clearInterval(interval);
      setIsSpinning(false);

      actions.drawLucky().then(() => {
        setTimeout(() => {
          actions.checkWinner();
          setCanDraw(false);
        }, 600);
      });
    }, 8000);
  };

  const isConnected = !!currentAccount;

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
        <div className="max-w-md w-full text-center">
          <Heading size="6" className="mb-4">
            Lottery
          </Heading>
          <Text>Please connect your wallet to continue.</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-background text-foreground">
      <div className="max-w-2xl mx-auto">
        <Heading size="6" className="mb-10 text-center">
          Lottery
        </Heading>
        {isWinner === true && (
          <div className="mb-4 p-4 rounded-lg border border-green-400 bg-green-200">
            <Heading size="4">You’re a winner!</Heading>
            <Text className="text-green-600 block">
              Congratulations! Your ticket matched the lucky number.
            </Text>
            <Text className="text-xs font-mono text-gray-600">
              Winner Object ID: {winnerId}
            </Text>
          </div>
        )}
        {isWinner === false && (
          <div className="mb-4 p-4 rounded-lg border border-red-400 bg-red-200">
            <Text className="text-red-600 font-semibold">
              Not a winning ticket.
            </Text>
          </div>
        )}
        {isSpinning && (
          <div className="mb-4 p-4 rounded-lg border border-yellow-400 bg-yellow-200">
            <Text className="font-bold text-yellow-700">
              Spinning: {spinningNumber}
            </Text>
          </div>
        )}
        {!isSpinning && luckyNumber !== null && (
          <div className="mb-4 p-4 rounded-lg border border-yellow-400 bg-yellow-200">
            <Text className="font-bold text-yellow-700">
              Lucky Number: {luckyNumber}
            </Text>
          </div>
        )}
        {lotteryBoxId && data && (
          <div className="mb-4 p-4 rounded-lg border bg-background">
            <Text className="font-semibold block">Your Ticket</Text>

            <Text className="block">
              Ticket Number: <strong>{data.number}</strong>
            </Text>

            <Text className="text-xs font-mono text-gray-60">
              Ticket ID: {lotteryBoxId}
            </Text>
          </div>
        )}
        <div className="p-4 rounded-lg border bg-foreground mb-4">
          <Heading size="4" className="mb-2">
            Buy a Ticket
          </Heading>

          <TextField.Root
            value={ticketNumber}
            onChange={(e) => setTicketNumber(e.target.value)}
            type="number"
            min="0"
            max="65535"
            className="mb-3 w-full"
          />

          <Button
            size="3"
            className="cursor-pointer"
            onClick={async () => {
              await actions.buyTicket(parseInt(ticketNumber, 10));
              setTicketNumber("0");
              setIsSpinning(false);
              setSpinningNumber(null);
              setCanDraw(true);
            }}
            disabled={state.isLoading}
          >
            {state.isLoading ? (
              <>
                <ClipLoader size={16} className="mr-2" />
                Processing...
              </>
            ) : (
              "Buy Ticket"
            )}
          </Button>
        </div>
        {lotteryBoxId && canDraw && (
          <div className="p-4 rounded-lg bg-foreground mb-4">
            <Heading size="4" className="mb-2">
              Draw Lucky Number
            </Heading>

            <Button
              size="3"
              onClick={startSpin}
              disabled={state.isLoading || isSpinning}
            >
              {isSpinning ? "Spinning..." : "Draw Lucky Number"}
            </Button>
          </div>
        )}
        {state.hash && (
          <div className="mt-4 p-4 rounded-lg bg-background ">
            <Text className="text-sm">Transaction Hash:</Text>
            <Text className="font-mono break-all">{state.hash}</Text>
          </div>
        )}

        {/* ERROR */}
        {state.error && (
          <div className="mt-4 p-4 rounded-lg bg-red-200 border border-red-400">
            <Text className="text-red-700 font-semibold">
              Error: {state.error.message}
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};

export default LotteryIntegration;
