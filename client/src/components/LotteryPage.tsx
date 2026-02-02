
import { useState } from "react";
import { useCurrentAccount } from "@iota/dapp-kit";
import { useContract } from "../hooks/useContract";
import { Button, Heading, Text, TextField } from "@radix-ui/themes";
import ClipLoader from "react-spinners/ClipLoader";
import { useWalletObjects } from "../hooks/useWalletObjects";
import { UserAuthStore } from "../store/userAuthStore";

const secureRandom100 = () => {

  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % 100;
};

const LotteryIntegration = () => {
  const currentAccount = useCurrentAccount(); // kết nối ví
  const {
    data,
    luckyNumber,
    actions,
    state,
    lotteryBoxId,
    winnerId,
    luckyId,
    isWinner,
  } = useContract();
  const userStr = localStorage.getItem("userLottery")
  const user = userStr ? JSON.parse(userStr) : null;
  console.log(user, "useruseruseruseruser")
  const { logout } = UserAuthStore()
  const [ticketNumber, setTicketNumber] = useState("0");
  const [spinningNumber, setSpinningNumber] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [canDraw, setCanDraw] = useState(true);
  const wallet = useWalletObjects();
  console.log(wallet, "fkfkbfbnf")
  const PAGE_SIZE = 100;
  const [page, setPage] = useState(0);
  const paginated = wallet.objects.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );
  const startSpin = async () => {
    if (isSpinning || state.isLoading || !canDraw) return;
    setIsSpinning(true);
    const interval = setInterval(() => {
      setSpinningNumber(secureRandom100());
    }, 50);
    setTimeout(async () => {
      clearInterval(interval);
      setIsSpinning(false);
      const objId = await actions.drawLucky();
      if (!objId) {
        alert("Lucky number not ready. Try again.");
        return;
      }
      await new Promise(r => setTimeout(r, 700));
      await actions.checkWinner(objId);
      setCanDraw(false);
    }, 8000);
  };
  const isConnected = !!currentAccount;

  // useEffect(() => {

  //   if (!lotteryBoxId) {
  //     setCanDraw(true);
  //   }
  // }, [lotteryBoxId]);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <Heading size="6" className="mb-4">Lottery</Heading>
          <Text>Vui lòng kết nối ví của bạn để tiếp tục.</Text>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen p-4">
      {user && (
        <div className="flex justify-between items-center mb-6 p-4 border rounded bg-white">
          <Text className="font-semibold text-blue-500">
            Xin chào, <span className="text-blue-600">{user.fullName}</span>
          </Text>

          <Button
            size="2"
            color="red"
            onClick={async () => {
              await logout()
              window.location.href = "/login";
            }}
          >
            Đăng xuất
          </Button>
        </div>
      )}
      <div className="max-w-2xl mx-auto">

        <Heading size="6" className="mb-10 text-center">
          Lottery Game
        </Heading>
        {isWinner === true && (
          <div className="mb-4 p-4 rounded-lg border border-green-400 bg-green-200">
            <Heading size="4">Bạn thắng!</Heading>
            <Text className="text-green-700">
              Vé của bạn trùng khớp với con số may mắn.
            </Text>
            <Text className="text-xs font-mono">Winner Object: {winnerId}</Text>
          </div>
        )}
        {isWinner === false && (
          <div className="mb-4 p-4 rounded-lg border border-red-400 bg-red-200">
            <Text className="text-red-700 font-semibold">Chúc bạn may mắn lần sau</Text>
          </div>
        )}
        {isSpinning && (
          <div className="mb-4 p-4 border rounded bg-yellow-200">
            <Text className="font-bold text-yellow-700">
              Spinning: {spinningNumber}
            </Text>
          </div>
        )}
        {!isSpinning && luckyNumber !== null && (
          <div className="mb-4 p-4 border rounded bg-yellow-200">
            <Text className="font-bold text-yellow-700">
              Lucky Number: {luckyNumber}
            </Text>
            <Text className="text-xs font-mono text-yellow-800 block mt-1">
              Lucky Number ID: {luckyId}
            </Text>
          </div>
        )}
        {lotteryBoxId && data && (
          <div className="mb-4 p-4 border rounded bg-background">
            <Text className="font-semibold block">Your Ticket</Text>
            <Text>Ticket Number: <strong>{data.number}</strong></Text>
            <Text className="text-xs font-mono block">Ticket ID: {lotteryBoxId}</Text>
          </div>
        )}
        <div className="p-4 border rounded mb-4 bg-foreground">
          <Heading size="4" className="mb-2">Buy a Ticket</Heading>

          <TextField.Root
            value={ticketNumber}
            onChange={(e) => setTicketNumber(e.target.value)}
            type="number"
            className="mb-3 w-full"
          />

          <Button
            size="3"
            onClick={async () => {
              const parsed = Number.parseInt(ticketNumber, 10); // chuyển string thành số
              if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65535) {
                alert("Số vé không hợp lệ");
                return;
              }

              try {
                await actions.buyTicket(parsed);
                setTicketNumber("0");
                setIsSpinning(false);
                setSpinningNumber(null);
                setCanDraw(true);
              } catch (e: any) {
                alert("Mua vé không thành công:" + (e?.message || "Lỗi không xác định"));
              }
            }}
            disabled={state.isLoading}
          >
            {state.isLoading ? (
              <>
                <ClipLoader size={16} className="mr-2" />
                Processing...
              </>
            ) : (
              "Mua vé"
            )}
          </Button>
        </div>
        {lotteryBoxId && canDraw && (
          <div className="p-4 border rounded bg-foreground mb-4">
            <Heading size="4" className="mb-2">Draw Lucky Number</Heading>

            <Button
              size="3"
              onClick={startSpin}
              disabled={state.isLoading || isSpinning || !canDraw}
            >
              {isSpinning ? "Quay..." : "Quay số may mắn"}
            </Button>
          </div>
        )}
        {state.hash && (
          <div className="mt-4 p-4 border rounded bg-background">
            <Text className="text-sm">Transaction:</Text>
            <Text className="font-mono break-all">{state.hash}</Text>
          </div>
        )}
        {state.error && (
          <div className="mt-4 p-4 border bg-red-200 rounded">
            <Text className="text-red-700 font-semibold">
              Error: {state.error?.message || String(state.error)}
            </Text>
          </div>
        )}
      </div>
      <div className="mt-10 p-6 border rounded-lg max-w-2xl mx-auto bg-white shadow-sm">
        <Heading size="4" className="mb-4 text-gray-800">
          Ví của bạn
        </Heading>

        {wallet.isLoading && <Text>Loading wallet objects...</Text>}

        {!wallet.isLoading && wallet.objects.length === 0 && (
          <Text className="text-gray-500">No objects found in your wallet.</Text>
        )}
        <div className="space-y-4">
          {!wallet.isLoading &&
            paginated.map((obj: any) => {
              const type = obj.data?.content?.type || "";
              const fields = obj.data?.content?.fields;

              let display = null;
              if (type.includes("LotteryBox")) {
                display = (
                  <div className="text-blue-700">
                    <div className="font-bold text-lg">Lottery Ticket</div>
                    <div>Ticket Number: <strong>{fields.ticket.fields.number}</strong></div>
                  </div>
                );
              } else if (type.includes("LuckyNumber")) {
                display = (
                  <div className="text-yellow-700">
                    <div className="font-bold text-lg">Lucky Number</div>
                    <div>Lucky Number: <strong>{fields.number}</strong></div>
                  </div>
                );
              } else if (type.includes("Winner")) {
                display = (
                  <div className="text-green-700">
                    <div className="font-bold text-lg">Winner Badge</div>
                    <div>You won the lottery!</div>
                  </div>
                );
              } else {
                display = (
                  <div className="text-gray-700">
                    <div className="font-bold text-lg">Object</div>
                    <div>Type: {type}</div>
                  </div>
                );
              }

              return (
                <div
                  key={obj.data?.objectId}
                  className="p-4 rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col gap-1 mb-2">
                    <Text className="text-xs font-mono text-gray-500 block">
                      {obj.data?.objectId}
                    </Text>
                    <Text className="text-xs text-gray-400 block">{type.split("::").pop()}</Text>
                    <Text className="text-xs font-mono text-gray-500 block">
                      Block: {obj.block ?? "--"}
                    </Text>
                    <Text className="text-xs font-mono text-gray-400 break-all">
                      Prev: {obj.prev ?? "--"}
                    </Text>
                  </div>

                  {display}
                </div>
              );
            })}
        </div>
        {!wallet.isLoading && wallet.objects.length > PAGE_SIZE && (
          <div className="flex justify-between items-center mt-6">
            <Button
              size="2"
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
              disabled={page === 0}
            >
              Prev
            </Button>

            <Text className="text-sm">
              Page {page + 1} / {Math.ceil(wallet.objects.length / PAGE_SIZE)}
            </Text>

            <Button
              size="2"
              onClick={() =>
                setPage((p) =>
                  p + 1 < Math.ceil(wallet.objects.length / PAGE_SIZE) ? p + 1 : p
                )
              }
              disabled={page + 1 >= Math.ceil(wallet.objects.length / PAGE_SIZE)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
export default LotteryIntegration;
