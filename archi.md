# Polaris Protocol Architecture

## 1. Core Bridge Architecture (Real Cross-Chain)
> **Creditcoin (USC) Decentralized Oracle** trustlessly bridges liquidity and data from Source Chains (Sepolia) to the Master Hub (USC Testnet).

### Flow Overview
1.  **Source Chain (Sepolia)**: `LiquidityVault` custodies assets.
    *   Action: `deposit(token, amount)`
    *   Event: `LiquidityDeposited` serves as the "Source of Truth".
2.  **The Bridge (Relayer)**:
    *   Detects deposit event.
    *   Submits transaction hash to Creditcoin Oracle via `submit_query`.
    *   Oracle verifies finality (~15 mins) and returns a `queryId`.
3.  **Master Hub (USC Testnet)**: `PoolManager` logic.
    *   User/Relayer calls `addLiquidityFromProof(queryId)`.
    *   Contract verifies data against Oracle and updates Global LP Configuration.

---

## 2. Payment Gateway Architecture (Shopify Integration)
> **Polaris Checkout (PayEase)** acts as the central payment processor, enabling instant crypto settlements for e-commerce platforms like Shopify.

### Offsite Payment Flow
We utilize a **Redirect-Based** architecture to securely handle payments off-platform, ensuring users pay via their Web3 wallets on our trusted interface.

```mermaid
sequenceDiagram
    participant User
    participant Shopify as Shopify Store
    participant Checkout as Polaris Checkout Ext
    participant PayEase as Polaris Core (PayEase)
    participant Contract as Creditcoin Escrow

    User->>Shopify: Clicks "Pay with Polaris"
    Shopify->>Checkout: POST /api/payment-session
    Note right of Shopify: Sends Order ID, Amount, Customer Info
    
    Checkout->>PayEase: POST /api/bills/create
    Note right of Checkout: Authenticates with Client ID/Secret
    
    PayEase->>PayEase: Create Bill Record (Pending)
    PayEase-->>Checkout: Returns { checkoutUrl: "https://polaris.network/pay/[hash]" }
    
    Checkout-->>Shopify: Returns { redirect_url: checkoutUrl }
    Shopify->>User: Redirects to Polaris Payment Page
    
    User->>PayEase: Connects Wallet & Approves
    PayEase->>Contract: settlePayment(amount, hash)
    Contract-->>PayEase: Emits PaymentSettled
    
    PayEase->>Shopify: Redirects User to "Thank You" Page
```

### Components
1.  **Polaris Shopify App**: A lightweight middleware installed on the merchant's store.
    *   **Role**: Credential management & Request forwarding.
    *   **Endpoint**: `/api/payment-session`
2.  **Polaris Core (PayEase)**: The central hub for all payment processing.
    *   **Role**: Bill generation, Wallet connection, Smart Contract interaction.
    *   **Endpoint**: `/api/bills/create` (S2S), `/pay/[hash]` (Client UI).
3.  **Smart Contracts**:
    *   **MerchantApps**: Stores merchant config (Escrow params).
    *   **Bills**: Tracks payment status and transaction hashes on-chain.

