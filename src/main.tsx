import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import "@iota/dapp-kit/dist/index.css";
import "@radix-ui/themes/styles.css";

import { IotaClientProvider, WalletProvider } from "@iota/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Theme } from "@radix-ui/themes";
import { networkConfig } from "./lib/config";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Theme appearance="dark">
      <QueryClientProvider client={queryClient}>
        <IotaClientProvider networks={networkConfig} defaultNetwork="testnet">
          <WalletProvider autoConnect>
            <App />
          </WalletProvider>
        </IotaClientProvider>
      </QueryClientProvider>
    </Theme>
  </React.StrictMode>
);
