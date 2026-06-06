"use client"

import type React from "react"

import { ConnectGate } from "@/components/connect-gate"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import Image from "next/image"

export default function KycPage() {
  return (
    <ConnectGate>
      <KycForm />
    </ConnectGate>
  )
}

function KycForm() {
  const [file, setFile] = useState<File | null>(null)
  const [src, setSrc] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      const url = URL.createObjectURL(f)
      setSrc(url)
    }
  }

  return (
    <div className="rounded-3xl p-5 bg-card/40 border border-border/40 backdrop-blur-xl space-y-4">
      <h1 className="text-lg font-semibold">KYC Verification</h1>
      <p className="text-sm text-foreground/70">Upload a government-issued ID and a selfie.</p>

      <div className="space-y-2">
        <Label>Document</Label>
        <Input type="file" accept="image/*" onChange={onPick} />
      </div>

      {src && (
        <div className="rounded-xl overflow-hidden border border-border/40">
          <Image src={src || "/placeholder.svg"} alt="Preview" width={640} height={400} className="w-full h-auto" />
        </div>
      )}

      <Button
        className="w-full rounded-full"
        onClick={() => {
          setSubmitted(true)
        }}
        disabled={!file}
      >
        Submit
      </Button>

      {submitted && <div className="text-sm">KYC submitted. We’ll notify you once approved.</div>}
    </div>
  )
}
