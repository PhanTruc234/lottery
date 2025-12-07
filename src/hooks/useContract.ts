import { useState } from "react";
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
  const [lotteryBoxId, setLotteryBoxId] = useState(() =>
    address ? localStorage.getItem(`lotteryBox_${address}`) : null
  );

  const [luckyId, setLuckyId] = useState(() =>
    address ? localStorage.getItem(`lucky_${address}`) : null
  );

  const [luckyNumber, setLuckyNumber] = useState<number | null>(() => {
    const saved = address
      ? localStorage.getItem(`luckyNumber_${address}`)
      : null;
    return saved ? Number(saved) : null;
  });

  const [winnerId, setWinnerId] = useState(() =>
    address ? localStorage.getItem(`winner_${address}`) : null
  );

  const [isWinner, setIsWinner] = useState<boolean | null>(null);

  const [hash, setHash] = useState<string>();
  const [error, setError] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { data, refetch } = useIotaClientQuery(
    "getObject",
    { id: lotteryBoxId!, options: { showContent: true } },
    { enabled: !!lotteryBoxId }
  );

  const ticketData = data?.data ? parseTicket(data.data) : null;
  const buyTicket = async (num: number) => {
    if (!packageId) return;
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
      }
    );
  };
  const drawLucky = async () => {
    if (!packageId) return;

    setIsWinner(null);
    setWinnerId(null);
    setLuckyNumber(null);

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

          const result = await client.waitForTransaction({
            digest,
            options: { showEffects: true },
          });

          const created = result.effects?.created ?? [];
          const luckyObj = created[created.length - 1];
          const objId = luckyObj?.reference?.objectId;

          if (objId) {
            setLuckyId(objId);
            localStorage.setItem(`lucky_${address}`, objId);

            const luckyData = await client.getObject({
              id: objId,
              options: { showContent: true },
            });

            const parsed = parseLucky(luckyData.data!);

            if (parsed) {
              setLuckyNumber(parsed.number);
              localStorage.setItem(`luckyNumber_${address}`, parsed.number.toString());
            }
          }

          setIsLoading(false);
        },
      }
    );
  };
  const checkWinner = async () => {
    if (!lotteryBoxId || !luckyId || !packageId) return;

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

          const res = await client.waitForTransaction({
            digest,
            options: { showEffects: true },
          });

          const created = res.effects?.created ?? [];
          const objId = created[0]?.reference?.objectId;

          if (objId) {
            setWinnerId(objId);
            setIsWinner(true);
            localStorage.setItem(`winner_${address}`, objId);
          } else {
            setIsWinner(false);
          }

          setIsLoading(false);
        },
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
