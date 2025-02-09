"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Check, Copy } from "lucide-react"

interface CopyableInputProps {
  value: string
  label: string
}

export function CopyableInput({ value, label }: CopyableInputProps) {
  const [isCopied, setIsCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000) // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  return (
    <div className="w-full max-w-md">
      <label htmlFor="copyInput" className="block mb-2 text-sm font-medium text-[#68FFFE]">
        {label}
      </label>
      <div className="flex">
        <input
          type="text"
          id="copyInput"
          className="flex-grow px-3 py-2 bg-[#2A2F57] text-[#68FFFE] border border-[#68FFFE] rounded-l-md focus:outline-none focus:ring-1 focus:ring-[#68FFFE]"
          value={value}
          readOnly
          disabled
        />
        <Button
          onClick={copyToClipboard}
          className="px-3 py-6 bg-[#68FFFE] text-[#171B37] rounded-r-md hover:bg-[#68FFFE]/90 focus:outline-none focus:ring-1 focus:ring-[#68FFFE]"
        >
          {isCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  )
}

