import { useIotaClient, useIotaClientQuery, useCurrentAccount } from "@iota/dapp-kit";

export const useWalletObjects = () => {
    const account = useCurrentAccount();
    const address = account?.address;
    const client = useIotaClient();

    const { data, isLoading, refetch } = useIotaClientQuery(
        "getOwnedObjects",
        {
            owner: address!,
            options: { showContent: true }
        },
        { enabled: !!address }
    );

    const objects = data?.data ?? [];

    return {
        objects,
        isLoading,
        refetch,
    };
};
