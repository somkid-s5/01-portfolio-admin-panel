"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md space-y-3 text-center">
        <h1 className="text-xl font-semibold">Admin area crashed</h1>
        <p className="text-sm text-muted-foreground">
          We hit an unexpected error while loading the admin interface.
        </p>
        <div className="flex justify-center gap-2">
          <Button onClick={reset}>Retry</Button>
          <Button variant="outline" onClick={() => (window.location.href = "/admin/dashboard")}>
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
