"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Postmortem } from "@/lib/types"

type PostmortemModalProps = {
  postmortems: Postmortem[]
}

export function PostmortemModal({ postmortems }: PostmortemModalProps) {
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState(0)

  // Auto-open when a new postmortem arrives
  useEffect(() => {
    if (postmortems.length > seen) {
      setOpen(true)
      setSeen(postmortems.length)
    }
  }, [postmortems.length, seen])

  const latest = postmortems[postmortems.length - 1]
  if (!latest) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto border-red-500/30 bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-400">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Post-Incident Report
          </DialogTitle>
        </DialogHeader>

        <div className="prose prose-invert prose-sm max-w-none">
          <div className="rounded-lg border border-border bg-background/50 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
            {latest.markdown}
          </div>
        </div>

        <div className="mt-2 text-[10px] text-muted-foreground">
          Trace: {latest.trace_id}
        </div>
      </DialogContent>
    </Dialog>
  )
}
