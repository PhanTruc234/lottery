
import "./globals.css";
import { Provider } from "../components/Provider";
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Provider>{children}</Provider>
    </html>
  );
}
