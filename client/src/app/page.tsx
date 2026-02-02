import LotteryIntegration from "../components/LotteryPage";
import { WalletConnect } from "../components/WalletConnect";



export default function Home() {
  return (
    <div>
      <WalletConnect />
      <LotteryIntegration />
    </div>
  );
}
