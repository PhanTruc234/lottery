"use client";

import { useIotaClient, useCurrentAccount } from "@iota/dapp-kit";
import { useEffect, useState } from "react";

export const useWalletObjects = () => {
    const account = useCurrentAccount();
    const address = account?.address;
    const client = useIotaClient();

    const [objects, setObjects] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const fetchAll = async () => {
        let cursor: string | null = null;
        let all: any[] = [];

        while (true) {
            const res = await client.getOwnedObjects({
                owner: address!,
                cursor,
                options: { showContent: true, showType: true },
            });

            all = all.concat(res.data);

            if (!res.hasNextPage) break;
            cursor = res.nextCursor;
        }

        return all;
    };

    useEffect(() => {
        if (!address) return;

        const load = async () => {
            setIsLoading(true);

            const rawObjects = await fetchAll();

            const processed = await Promise.all(
                rawObjects.map(async (item) => {
                    const id = item.data?.objectId;
                    if (!id) return null;

                    try {
                        const obj = await client.getObject({
                            id,
                            options: { showPreviousTransaction: true },
                        });

                        const prevTx = obj.data?.previousTransaction;
                        let block = null;
                        let prev = null;

                        if (prevTx) {
                            const txInfo = await client.getTransactionBlock({
                                digest: prevTx,
                            });

                            const checkpointId = txInfo.checkpoint;
                            if (checkpointId != null) {
                                const cp = await client.getCheckpoint({
                                    id: checkpointId.toString(),
                                });

                                block = checkpointId;
                                prev = cp.previousDigest ?? null;
                            }
                        }

                        return { ...item, block, prev };
                    } catch {
                        return { ...item, block: null, prev: null };
                    }
                })
            );

            setObjects(processed.filter(Boolean));
            setIsLoading(false);
        };

        load();
    }, [address]);

    return { objects, isLoading };
};


// "use client";

// import { useIotaClient, useIotaClientQuery, useCurrentAccount } from "@iota/dapp-kit";
// export const useWalletObjects = () => {
//     const account = useCurrentAccount();
//     const address = account?.address;
//     const client = useIotaClient();

//     const { data, isLoading, refetch } = useIotaClientQuery(
//         "getOwnedObjects",
//         {
//             owner: address!,
//             options: { showContent: true }
//         },
//         { enabled: !!address }
//     );

//     const objects = data?.data ?? [];

//     return {
//         objects,
//         isLoading,
//         refetch,
//     };
// };