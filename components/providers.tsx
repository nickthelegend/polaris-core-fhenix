"use client";

import { PropsWithChildren } from "react";
import { http, WagmiProvider } from "wagmi";
import { sepolia, hardhat } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme, getDefaultConfig } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { ThemeProvider } from "next-themes";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Toaster } from "sonner";

const wagmiConfig = getDefaultConfig({
  appName: "Polaris Pay",
  projectId: "YOUR_PROJECT_ID",
  chains: [sepolia, hardhat],
  transports: {
    [sepolia.id]: http(),
    [hardhat.id]: http("http://127.0.0.1:8545"),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: PropsWithChildren) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <RainbowKitProvider theme={darkTheme()}>
            {children}
            <Toaster position="top-right" theme="dark" />
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </RainbowKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
