'use client';

import { useContractConnection } from '@/lib/algorand/hooks';

export function ContractStatus() {
  const { status, loading, checkConnection } = useContractConnection();

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        Checking contracts...
      </div>
    );
  }

  if (!status) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${
        status.isConnected ? 'bg-green-500' : 'bg-red-500'
      }`}></div>
      <span className={status.isConnected ? 'text-green-600' : 'text-red-600'}>
        {status.isConnected ? 'Contracts Connected' : 'Contracts Disconnected'}
      </span>
      <button 
        onClick={checkConnection}
        className="text-blue-500 hover:text-blue-700 underline"
      >
        Refresh
      </button>
    </div>
  );
}

export function DetailedContractStatus() {
  const { status, loading, checkConnection } = useContractConnection();

  if (loading) {
    return <div className="text-center py-4">Checking contract status...</div>;
  }

  if (!status) return null;

  return (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Smart Contract Status</h3>
        <button 
          onClick={checkConnection}
          className="text-sm text-blue-500 hover:text-blue-700"
        >
          Refresh
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span>Algorand Client</span>
          <StatusIndicator connected={status.algodClient} />
        </div>
        <div className="flex items-center justify-between">
          <span>Main Contract</span>
          <StatusIndicator connected={status.mainContract} />
        </div>
        <div className="flex items-center justify-between">
          <span>User Contract</span>
          <StatusIndicator connected={status.userContract} />
        </div>
      </div>

      {status.error && (
        <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
          Error: {status.error}
        </div>
      )}
    </div>
  );
}

function StatusIndicator({ connected }: { connected: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <div className={`w-2 h-2 rounded-full ${
        connected ? 'bg-green-500' : 'bg-red-500'
      }`}></div>
      <span className={connected ? 'text-green-600' : 'text-red-600'}>
        {connected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
}