"use client"

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import { logger } from "@/lib/logger";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error("SYSTEM", "Uncaught component error", {
      error,
      componentStack: errorInfo.componentStack
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full glass-card border border-red-500/30 p-8 rounded-3xl shadow-[0_0_50px_-12px_rgba(239,68,68,0.3)] space-y-6">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white uppercase tracking-tighter">System_Failure</h1>
              <p className="text-sm text-foreground/40 leading-relaxed uppercase tracking-widest font-bold">
                An unexpected error occurred in the Polaris interface.
              </p>
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-[10px] font-mono text-red-400/80 break-all text-left">
                {this.state.error?.message || "Unknown error detected"}
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-primary py-4 rounded-2xl font-black text-sm uppercase text-black hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
              >
                <RefreshCcw className="w-4 h-4" />
                Reload_Interface
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-white/5 border border-white/10 py-4 rounded-2xl font-black text-sm uppercase text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Return_to_Hub
              </button>
            </div>
          </div>
          
          <div className="mt-8 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] text-foreground/20 font-black uppercase tracking-[0.3em]">
              Polaris Terminal · Error_Log_Transmitted
            </span>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
