import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const target = Number(body?.target ?? 0)
  const status = target > 0 ? "under-review" : "invalid"
  return NextResponse.json({ status, requested: target })
}
