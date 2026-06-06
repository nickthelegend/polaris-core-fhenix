/**
 * Feature: real-data-layer, Property 8: Hook writes position after confirmed tx
 * Validates: Requirements 7.1, 7.2
 *
 * For any successful supply() or borrow() call that returns a txHash, the hook
 * should call POST /api/positions with the correct payload (walletAddress, type,
 * symbol, entryAmount, txHash).
 */

import * as fc from 'fast-check';

// ── Minimal stubs so the hook module can be imported in Node ─────────────────

// React hooks
jest.mock('react', () => ({
  useState: (init: unknown) => {
    let val = typeof init === 'function' ? init() : init;
    return [val, (next: unknown) => { val = typeof next === 'function' ? (next as (v: unknown) => unknown)(val) : next; }];
  },
  useCallback: (fn: unknown) => fn,
}));

// usePolaris — provides address + getContract
const mockGetContract = jest.fn();
jest.mock('@/hooks/use-polaris', () => ({
  usePolaris: () => ({
    address: '0xTestWallet',
    chainId: '31337',
    getContract: mockGetContract,
  }),
}));

// contracts constants
jest.mock('@/lib/contracts', () => ({
  CONTRACTS: {
    LOCAL_HARDHAT: {
      PRIVATE_COLLATERAL_VAULT: '0xVault',
      PRIVATE_BORROW_MANAGER: '0xBorrow',
      PRIVATE_LENDING_POOL: '0xPool',
    },
    PRIVATE_LENDING: {
      PRIVATE_COLLATERAL_VAULT: '0xVault',
      PRIVATE_BORROW_MANAGER: '0xBorrow',
      PRIVATE_LENDING_POOL: '0xPool',
    },
  },
  ABIS: {
    PrivateCollateralVault: [],
    PrivateBorrowManager: [],
    PrivateLendingPool: [],
  },
  NETWORKS: {
    SEPOLIA: { id: 11155111 },
    LOCAL_HARDHAT: { id: 31337 },
  },
}));

// ethers — not needed for these tests
jest.mock('ethers', () => ({}));

// ── Import hook after mocks ──────────────────────────────────────────────────
import { useFhePrivateLending } from '../use-fhe-private-lending';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeMockContract(txHash: string) {
  return {
    supply: jest.fn().mockResolvedValue({ wait: async () => ({ hash: txHash }) }),
    borrow: jest.fn().mockResolvedValue({ wait: async () => ({ hash: txHash }) }),
    getSuppliedAmount: jest.fn().mockResolvedValue('0x0'),
    getDebtAmount: jest.fn().mockResolvedValue('0x0'),
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Property 8: Hook writes position after confirmed tx', () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);
    mockGetContract.mockReset();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('supply() calls POST /api/positions with correct payload for any symbol and amount', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('ETH', 'USDC', 'WBTC', 'BNB'),
        fc.bigInt({ min: BigInt(1), max: BigInt(1000) * BigInt(1e18) }),
        fc.hexaString({ minLength: 64, maxLength: 64 }).map(h => '0x' + h),
        async (symbol, amount, txHash) => {
          fetchSpy.mockClear();
          const contract = makeMockContract(txHash);
          mockGetContract.mockResolvedValue(contract);

          const { supply } = useFhePrivateLending();
          await supply(amount, symbol);

          const postCalls = fetchSpy.mock.calls.filter(
            ([url, opts]) => url === '/api/positions' && opts?.method === 'POST'
          );
          if (postCalls.length === 0) return false;

          const body = JSON.parse(postCalls[0][1].body);
          return (
            body.walletAddress === '0xtestwallet' &&
            body.type === 'SUPPLY' &&
            body.symbol === symbol &&
            body.entryAmount === Number(amount) / 1e18 &&
            body.txHash === txHash
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it('borrow() calls POST /api/positions with correct payload for any symbol and amount', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('ETH', 'USDC', 'WBTC', 'BNB'),
        fc.bigInt({ min: BigInt(1), max: BigInt(1000) * BigInt(1e18) }),
        fc.hexaString({ minLength: 64, maxLength: 64 }).map(h => '0x' + h),
        async (symbol, amount, txHash) => {
          fetchSpy.mockClear();
          const contract = makeMockContract(txHash);
          mockGetContract.mockResolvedValue(contract);

          const { borrow } = useFhePrivateLending();
          await borrow(amount, symbol);

          const postCalls = fetchSpy.mock.calls.filter(
            ([url, opts]) => url === '/api/positions' && opts?.method === 'POST'
          );
          if (postCalls.length === 0) return false;

          const body = JSON.parse(postCalls[0][1].body);
          return (
            body.walletAddress === '0xtestwallet' &&
            body.type === 'BORROW' &&
            body.symbol === symbol &&
            body.entryAmount === Number(amount) / 1e18 &&
            body.txHash === txHash
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
