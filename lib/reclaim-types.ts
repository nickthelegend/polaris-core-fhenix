export type VerificationProvider = "github" | "gmail" | "linkedin"

export interface VerificationOption {
  id: VerificationProvider
  name: string
  description: string
  algoReward: number
  icon: string
  providerId: string
}

export interface VerificationProof {
  identifier: string
  claimData: {
    provider: string
    parameters: string
    context: string
  }
  signatures: string[]
}

export interface VerificationResult {
  success: boolean
  provider: VerificationProvider
  algoReward: number
  proofs?: VerificationProof[]
  error?: string
}
