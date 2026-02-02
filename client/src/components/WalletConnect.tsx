import { ConnectButton } from "@iota/dapp-kit";
export function WalletConnect() {
  return (
    <div className="p-4 flex justify-end">
      <ConnectButton />
    </div>
  );
}
