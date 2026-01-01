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
  if (!f?.ticket?.fields?.number) return null;
  return { number: Number(f.ticket.fields.number) };
}

function parseLucky(data: IotaObjectData) {
  if (data.content?.dataType !== "moveObject") return null;
  const f = data.content.fields as any;
  if (typeof f?.number === "undefined") return null;
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

  const [hash, setHash] = useState<string | undefined>();
  const [error, setError] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address) {

      setLotteryBoxId(null);
      setLuckyId(null);
      setWinnerId(null);
      setLuckyNumber(null);
      setIsWinner(null);
      return;
    }

    async function load() {
      const boxKey = `lotteryBox_${address}`;
      const savedBox = localStorage.getItem(boxKey);

      if (savedBox) {
        try {
          const obj = await client.getObject({
            id: savedBox,
            options: { showOwner: true }
          });

          if (obj.data?.owner?.AddressOwner === address) {
            setLotteryBoxId(savedBox);
          } else {
            localStorage.removeItem(boxKey);
            setLotteryBoxId(null);
          }
        } catch {
          localStorage.removeItem(boxKey);
        }
      }
      // const luckyNum = localStorage.getItem(`luckyNumber_${address}`);
      // setLuckyNumber(luckyNum ? Number(luckyNum) : null);
    }

    load();
  }, [address]);
  const { data, refetch } = useIotaClientQuery(
    "getObject",
    { id: lotteryBoxId!, options: { showContent: true } },
    { enabled: !!lotteryBoxId }
  );

  const ticketData = data?.data ? parseTicket(data.data) : null;

  const buyTicket = async (num: number) => {
    setError(null);
    if (!packageId || !address) {
      setError(new Error("Network package or address not available"));
      return;
    }

    if (!Number.isInteger(num) || num < 0 || num > 65535) {
      setError(new Error("Invalid ticket number. Must be integer between 0 and 65535."));
      return;
    }

    setWinnerId(null);
    setLuckyId(null);
    setLuckyNumber(null);
    setIsWinner(null);
    // localStorage.removeItem(`lucky_${address}`);
    // localStorage.removeItem(`luckyNumber_${address}`);
    localStorage.removeItem(`winner_${address}`);
    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::${CONTRACT.MODULE}::${CONTRACT.BUY}`,
      arguments: [tx.pure.u16(num)],
    });

    signTx(
      { transaction: tx as any },
      {
        onSuccess: async ({ digest }) => {
          try {
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
              // await setSecureItem(`lotteryBox_${address}`, { id: objId });
              await refetch();
            }
          } catch (e) {
            setError(e);
          } finally {
            setIsLoading(false);
          }
        },
        onError: (err) => {
          setError(err);
        },
      }
    );
  };

  const drawLucky = async () => {
  if (!packageId || !address) {
    return null;
  }

  return new Promise<string | null>((resolve, reject) => {
    const tx = new Transaction();

    tx.moveCall({
      target: `${packageId}::${CONTRACT.MODULE}::${CONTRACT.DRAW}`,
      arguments: [],
    });

    signTx(
      { transaction: tx as any },
      {
        onSuccess: async ({ digest }) => {
          try {
            setIsLoading(true);
            setHash(digest);
            const res = await client.waitForTransaction({
              digest,
              options: { showEffects: true },
            });

            const created = res.effects?.created ?? [];

            // 🔥 LẤY ĐÚNG LuckyNumber VỪA TẠO
            const luckyRef = created.find(
              (o) =>
                o.owner?.AddressOwner === address &&
                o.reference?.objectId
            );

            if (!luckyRef) {
              resolve(null);
              return;
            }

            const objId = luckyRef.reference.objectId;
            setLuckyId(objId);
            const luckyData = await client.getObject({
              id: objId,
              options: { showContent: true },
            });

            const parsed = parseLucky(luckyData.data!);
            if (parsed) {
              setLuckyNumber(parsed.number);
            }

            resolve(objId);
          } catch (e) {
            reject(e);
          } finally {
            setIsLoading(false);
          }
        },
        onError: (err) => {
          setError(err);
          reject(err);
        },
      }
    );
  });
};
  const checkWinner = async (luckyObjId?: string) => {
    const lid = luckyObjId ?? luckyId;
    if (!lid || !lotteryBoxId) return Promise.reject("Missing IDs");
    return new Promise((resolve, reject) => {
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::${CONTRACT.MODULE}::${CONTRACT.CHECK}`,
        arguments: [tx.object(lotteryBoxId), tx.object(lid)],
      });
      signTx(
        { transaction: tx as any },
        {
          onSuccess: async ({ digest }) => {
            try {
              setIsLoading(true);
              setHash(digest);
              await client.waitForTransaction({
                digest,
                options: { showEffects: true },
              });
              await new Promise((r) => setTimeout(r, 900));
              const owned = await client.getOwnedObjects({
                owner: address,
                options: { showContent: true },
              });
              const winnerObj = owned.data.find(
                (o: any) =>
                  o.data?.content?.type === `${packageId}::lottery::Winner`
              );
              if (winnerObj) {
                const id = winnerObj.data?.objectId;
                if (!id) {
                  setIsWinner(false);
                  localStorage.removeItem(`winner_${address}`);
                  resolve(false);
                  return;
                }
                setWinnerId(id);
                localStorage.setItem(`winner_${address}`, id);
                setIsWinner(true);
                resolve(true);
              } else {
                setIsWinner(false);
                localStorage.removeItem(`winner_${address}`);
                resolve(false);
              }
            } catch (err) {
              reject(err);
            } finally {
              setIsLoading(false);
            }
          },

          onError: (err) => {
            setError(err);
            reject(err);
          },
        }
      );
    });
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

