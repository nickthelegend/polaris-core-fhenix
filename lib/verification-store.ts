// Simple in-memory store for verified accounts
// In production, this should be stored in a database

interface UserVerifications {
  [walletAddress: string]: {
    verifiedProviders: Set<string>
    totalAlgoEarned: number
    limitIncrease: number
  }
}

const verificationStore: UserVerifications = {}

export function addVerification(walletAddress: string, provider: string, algoReward: number) {
  if (!verificationStore[walletAddress]) {
    verificationStore[walletAddress] = {
      verifiedProviders: new Set(),
      totalAlgoEarned: 0,
      limitIncrease: 0,
    }
  }

  const userData = verificationStore[walletAddress]

  // Only add if not already verified
  if (!userData.verifiedProviders.has(provider)) {
    userData.verifiedProviders.add(provider)
    userData.totalAlgoEarned += algoReward
    // Increase limit by 2x the ALGO reward
    userData.limitIncrease += algoReward * 2
  }

  return userData
}

export function getUserVerifications(walletAddress: string) {
  return (
    verificationStore[walletAddress] || {
      verifiedProviders: new Set(),
      totalAlgoEarned: 0,
      limitIncrease: 0,
    }
  )
}

export function hasVerifiedProvider(walletAddress: string, provider: string): boolean {
  return verificationStore[walletAddress]?.verifiedProviders.has(provider) || false
}
