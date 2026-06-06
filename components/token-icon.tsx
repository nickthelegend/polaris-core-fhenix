import Image from "next/image"

const TOKEN_LOGOS: Record<string, string> = {
  ETH:   "/tokens/ethereum-eth-logo.svg",
  WETH:  "/tokens/ethereum-eth-logo.svg",
  BTC:   "/tokens/bitcoin-btc-logo.svg",
  WBTC:  "/tokens/bitcoin-btc-logo.svg",
  USDC:  "/tokens/usd-coin-usdc-logo.svg",
  USDT:  "/tokens/tether-usdt-logo.svg",
  BNB:   "/tokens/bnb-bnb-logo.svg",
}

export function TokenIcon({
  symbol,
  size = 20,
  className = "",
}: {
  symbol: string
  size?: number
  className?: string
}) {
  const src = TOKEN_LOGOS[symbol.toUpperCase()]

  if (!src) {
    return (
      <div
        className={`rounded-full bg-secondary/60 flex items-center justify-center font-bold text-white ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {symbol[0]}
      </div>
    )
  }

  // ETH/WETH logo is a tall portrait SVG — wrap it to clip and center properly
  const isTallLogo = symbol.toUpperCase() === "ETH" || symbol.toUpperCase() === "WETH"

  if (isTallLogo) {
    return (
      <div
        className={`rounded-full overflow-hidden flex items-center justify-center bg-[#627EEA]/10 flex-shrink-0 ${className}`}
        style={{ width: size, height: size, minWidth: size }}
      >
        <Image
          src={src}
          alt={symbol}
          width={Math.round(size * 0.6)}
          height={Math.round(size * 0.6)}
          className="object-contain"
        />
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={symbol}
      width={size}
      height={size}
      className={`rounded-full object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
