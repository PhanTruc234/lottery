import { useState, useEffect } from "react";
import {
  useCurrentAccount,
  useIotaClient,
  useIotaClientQuery,
  useSignAndExecuteTransaction,
} from "@iota/dapp-kit";

import { Transaction } from "@iota/iota-sdk/transactions";
import { useNetworkVariable } from "../lib/config";
import type { IotaObjectData } from "@iota/iota-sdk/client";

export const CONTRACT = {
  MODULE: "lottery",
  BUY: "buy_ticket",
  DRAW: "draw_lucky",
  CHECK: "check_winner",
};
function parseTicket(data: IotaObjectData) {
  if (data.content?.dataType !== "moveObject") return null;
  const f = data.content.fields as any;
  return { number: Number(f.ticket.fields.number) };
}

function parseLucky(data: IotaObjectData) {
  if (data.content?.dataType !== "moveObject") return null;
  const f = data.content.fields as any;
  return { number: Number(f.number) };
}
export const useContract = () => {
  const account = useCurrentAccount();
  const address = account?.address;

  const client = useIotaClient();
  const { mutate: signTx, isPending } = useSignAndExecuteTransaction();
  const packageId = useNetworkVariable("packageId");
  const [lotteryBoxId, setLotteryBoxId] = useState<string | null>(null);
  const [luckyId, setLuckyId] = useState<string | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);

  const [luckyNumber, setLuckyNumber] = useState<number | null>(null);
  const [isWinner, setIsWinner] = useState<boolean | null>(null);

  const [hash, setHash] = useState<string>();
  const [error, setError] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (!address) return;

    setLotteryBoxId(localStorage.getItem(`lotteryBox_${address}`));
    setLuckyId(localStorage.getItem(`lucky_${address}`));
    setWinnerId(localStorage.getItem(`winner_${address}`));

    const savedLucky = localStorage.getItem(`luckyNumber_${address}`);
    setLuckyNumber(savedLucky ? Number(savedLucky) : null);
  }, [address]);
  const { data, refetch } = useIotaClientQuery(
    "getObject",
    { id: lotteryBoxId!, options: { showContent: true } },
    { enabled: !!lotteryBoxId }
  );

  const ticketData = data?.data ? parseTicket(data.data) : null;
  const buyTicket = async (num: number) => {
    if (!packageId || !address) return;
    setWinnerId(null);
    setLuckyId(null);
    setLuckyNumber(null);
    setIsWinner(null);

    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::${CONTRACT.MODULE}::${CONTRACT.BUY}`,
      arguments: [tx.pure.u16(num)],
    });

    signTx(
      { transaction: tx as any },
      {
        onSuccess: async ({ digest }) => {
          setIsLoading(true);
          setHash(digest);

          const res = await client.waitForTransaction({
            digest,
            options: { showEffects: true },
          });

          const created = res.effects?.created ?? [];
          const objId = created[0]?.reference?.objectId;

          if (objId) {
            setLotteryBoxId(objId);
            localStorage.setItem(`lotteryBox_${address}`, objId);
            await refetch();
          }

          setIsLoading(false);
        },
        onError: (err) => setError(err),
      }
    );
  };
  const drawLucky = async () => {
    if (!packageId || !address) return;

    setWinnerId(null);
    setIsWinner(null);

    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::${CONTRACT.MODULE}::${CONTRACT.DRAW}`,
      arguments: [],
    });

    signTx(
      { transaction: tx as any },
      {
        onSuccess: async ({ digest }) => {
          setIsLoading(true);
          setHash(digest);

          await client.waitForTransaction({
            digest,
            options: { showEffects: true },
          });

          await new Promise((r) => setTimeout(r, 800));

          const owned = await client.getOwnedObjects({
            owner: address,
            options: { showContent: true },
          });

          const luckyObj = owned.data.find((o: any) =>
            o.data?.content?.type === `${packageId}::lottery::LuckyNumber`
          );

          if (!luckyObj) {
            console.warn("No LuckyNumber found.");
            setIsLoading(false);
            return;
          }

          const objId = luckyObj?.data?.objectId;
          if (!objId) {
            setIsLoading(false);
            return;
          }
          setLuckyId(objId);
          localStorage.setItem(`lucky_${address}`, objId);

          const luckyData = await client.getObject({
            id: objId,
            options: { showContent: true },
          });

          const parsed = parseLucky(luckyData.data!);
          if (parsed) {
            setLuckyNumber(parsed.number);
            localStorage.setItem(
              `luckyNumber_${address}`,
              parsed.number.toString()
            );
          }

          setIsLoading(false);
        },
        onError: (err) => setError(err),
      }
    );
  };
  const checkWinner = async () => {
    if (!lotteryBoxId || !luckyId || !packageId || !address) return;

    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::${CONTRACT.MODULE}::${CONTRACT.CHECK}`,
      arguments: [tx.object(lotteryBoxId), tx.object(luckyId)],
    });

    signTx(
      { transaction: tx as any },
      {
        onSuccess: async ({ digest }) => {
          setIsLoading(true);
          setHash(digest);

          await client.waitForTransaction({
            digest,
            options: { showEffects: true },
          });

          // WAIT FOR BLOCKCHAIN TO INDEX NEW OBJECT
          await new Promise((r) => setTimeout(r, 900));

          const owned = await client.getOwnedObjects({
            owner: address,
            options: { showContent: true },
          });

          const winnerObj = owned.data.find(
            (o: any) =>
              o.data?.content?.dataType === "moveObject" &&
              o.data?.content?.type === `${packageId}::lottery::Winner`
          );

          if (winnerObj) {
            const id = winnerObj?.data?.objectId;
            if (!id) {
              setIsWinner(false);
              localStorage.removeItem(`winner_${address}`);
              return;
            }
            setWinnerId(id);
            localStorage.setItem(`winner_${address}`, id);
            setIsWinner(true);
          } else {
            setIsWinner(false);
            localStorage.removeItem(`winner_${address}`);
          }

          setIsLoading(false);
        },
        onError: (err) => setError(err),
      }
    );
  };
  return {
    data: ticketData,
    luckyNumber,
    actions: { buyTicket, drawLucky, checkWinner },
    state: { isPending, isLoading, hash, error },
    lotteryBoxId,
    luckyId,
    winnerId,
    isWinner,
  };
};
