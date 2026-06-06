import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    code: "ABC123",
    link: "https://payease.app/r/ABC123",
    referred: 2,
    rewards: 3.5,
    asset: "USDC",
  })
}
