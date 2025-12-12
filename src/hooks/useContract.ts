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

import {
  setSecureItem,
  getSecureItem,
  removeSecureItem,
  secureNow,
} from "../lib/utils";

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

const DRAW_COOLDOWN_MS = 30 * 1000; 

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

    (async () => {
      try {

        const savedLottery = await getSecureItem<{ id: string }>(`lotteryBox_${address}`);
        const savedLucky = await getSecureItem<{ id: string }>(`lucky_${address}`);
        const savedWinner = await getSecureItem<{ id: string }>(`winner_${address}`);

    
        if (savedLottery?.id) {
          try {
            const obj = await client.getObject({ id: savedLottery.id, options: { showContent: true } });
           
            const owner = obj?.data?.owner ?? null;

            if (!obj?.data) {
              await removeSecureItem(`lotteryBox_${address}`);
            } else {
              setLotteryBoxId(savedLottery.id);
            }
          } catch (e) {
            await removeSecureItem(`lotteryBox_${address}`);
          }
        } else {
          setLotteryBoxId(null);
        }

        if (savedLucky?.id) {

          try {
            const obj = await client.getObject({ id: savedLucky.id, options: { showContent: true } });
            if (!obj?.data) await removeSecureItem(`lucky_${address}`);
            else setLuckyId(savedLucky.id);
          } catch (e) {
            await removeSecureItem(`lucky_${address}`);
          }
        } else {
          setLuckyId(null);
        }

        if (savedWinner?.id) {
  
          try {
            const obj = await client.getObject({ id: savedWinner.id, options: { showContent: true } });
            if (!obj?.data) await removeSecureItem(`winner_${address}`);
            else setWinnerId(savedWinner.id);
          } catch (e) {
            await removeSecureItem(`winner_${address}`);
          }
        } else {
          setWinnerId(null);
        }

        const savedLuckyNumber = await getSecureItem<{ number: number }>(`luckyNumber_${address}`);
        setLuckyNumber(savedLuckyNumber ? savedLuckyNumber.number : null);
      } catch (err) {
 
        await removeSecureItem(`lotteryBox_${address}`);
        await removeSecureItem(`lucky_${address}`);
        await removeSecureItem(`winner_${address}`);
        setLuckyNumber(null);
      }
    })();
  
  }, [address, client]);

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
              await setSecureItem(`lotteryBox_${address}`, { id: objId });
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
    setError(null);
    if (!packageId || !address) {
      setError(new Error("Network package or address not available"));
      return;
    }

    try {
      const last = (await getSecureItem<{ t: number }>(`last_draw_${address}`))?.t ?? 0;
      const now = secureNow();
      if (now - last < DRAW_COOLDOWN_MS) {
        setError(new Error("Please wait before drawing again."));
        return;
      }
  
      await setSecureItem(`last_draw_${address}`, { t: now });
    } catch (e) {

    }

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
          try {
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
            await setSecureItem(`lucky_${address}`, { id: objId });

            const luckyData = await client.getObject({
              id: objId,
              options: { showContent: true },
            });

            const parsed = parseLucky(luckyData.data!);
            if (parsed) {
              setLuckyNumber(parsed.number);
              await setSecureItem(`luckyNumber_${address}`, { number: parsed.number });
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

  const checkWinner = async () => {
    setError(null);
    if (!lotteryBoxId || !luckyId || !packageId || !address) {
      setError(new Error("Missing lotteryBoxId, luckyId, packageId or address"));
      return;
    }

    try {
      const obj = await client.getObject({ id: lotteryBoxId, options: { showContent: true } });

      const ownedObjects = await client.getOwnedObjects({ owner: address, options: { showContent: false } });
      const ownIds = new Set(ownedObjects.data.map((o: any) => o.data?.objectId));
      if (!ownIds.has(lotteryBoxId)) {
        setError(new Error("The ticket does not belong to your address."));
        
        await removeSecureItem(`lotteryBox_${address}`);
        setLotteryBoxId(null);
        return;
      }
    } catch (e) {
      setError(new Error("Failed to verify ticket ownership."));
      return;
    }

    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::${CONTRACT.MODULE}::${CONTRACT.CHECK}`,
      arguments: [tx.object(lotteryBoxId), tx.object(luckyId)],
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
                o.data?.content?.dataType === "moveObject" &&
                o.data?.content?.type === `${packageId}::lottery::Winner`
            );

            if (winnerObj) {
              const id = winnerObj?.data?.objectId;
              if (!id) {
                setIsWinner(false);
                await removeSecureItem(`winner_${address}`);
                return;
              }
              setWinnerId(id);
              await setSecureItem(`winner_${address}`, { id });
              setIsWinner(true);
            } else {
              setIsWinner(false);
              await removeSecureItem(`winner_${address}`);
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
