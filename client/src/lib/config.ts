

import { getFullnodeUrl } from "@iota/iota-sdk/client";
import { createNetworkConfig } from "@iota/dapp-kit";
export const DEVNET_PACKAGE_ID = "0x2c427943bf77390b52d046421a239598e20585fee6581f5ef566f59dd5b74481";
export const TESTNET_PACKAGE_ID = "0x91845ac43c7d91a266b7e7540c6d2cab11fd30fef826ef00606c3fefdf7802bb";
export const MAINNET_PACKAGE_ID = "";
const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    devnet: {
      url: getFullnodeUrl("devnet"),
      variables: {
        packageId: DEVNET_PACKAGE_ID,
      },
    },
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        packageId: TESTNET_PACKAGE_ID,
      },
    },
    mainnet: {
      url: getFullnodeUrl("mainnet"),
      variables: {
        packageId: MAINNET_PACKAGE_ID,
      },
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };
