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

    async function load() {
      // LOAD ticket ------------------
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

      // LOAD Lucky --------------------
      const luckyKey = `lucky_${address}`;
      const savedLucky = localStorage.getItem(luckyKey);

      if (savedLucky) {
        try {
          const obj = await client.getObject({
            id: savedLucky,
            options: { showOwner: true }
          });

          if (obj.data?.owner?.AddressOwner === address) {
            setLuckyId(savedLucky);
          } else {
            localStorage.removeItem(luckyKey);
            setLuckyId(null);
          }
        } catch {
          localStorage.removeItem(luckyKey);
        }
      }

      // LOAD Lucky Number -------------
      const luckyNum = localStorage.getItem(`luckyNumber_${address}`);
      setLuckyNumber(luckyNum ? Number(luckyNum) : null);
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
    if (!packageId || !address) {
      return Promise.resolve(null);
    }

    return new Promise((resolve, reject) => {
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

              const luckyObj = owned.data
                .filter(o => o.data?.content?.type === `${packageId}::lottery::LuckyNumber`)
                .sort((a, b) => Number(a.data?.content?.id?.creation_num) - Number(b.data?.content?.id?.creation_num))
                .at(-1);

              if (!luckyObj) {
                resolve(null);
                return;
              }

              const objId = luckyObj.data.objectId;
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

              resolve(objId); // 🔥 CỰC KỲ QUAN TRỌNG
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

              // wait for indexer to catch up
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
                const id = winnerObj.data?.objectId;   // FIXED
                if (!id) {
                  setIsWinner(false);
                  localStorage.removeItem(`winner_${address}`);
                  resolve(false);
                  return;
                }

                setWinnerId(id);
                localStorage.setItem(`winner_${address}`, id);
                setIsWinner(true);
                resolve(true);       // 🔥 giải phóng Promise → UI tiếp tục
              } else {
                setIsWinner(false);
                localStorage.removeItem(`winner_${address}`);
                resolve(false);       // 🔥 bắt buộc resolve
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
