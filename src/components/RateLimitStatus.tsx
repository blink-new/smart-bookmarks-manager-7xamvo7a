import { useState, useEffect } from 'react'
import { aiRateLimiter } from '../utils/rateLimiter'
import { Badge } from './ui/badge'
import { Loader2, Clock } from 'lucide-react'

export function RateLimitStatus() {
  const [status, setStatus] = useState({ queueLength: 0, processing: false })

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(aiRateLimiter.getStatus())
    }, 500)

    return () => clearInterval(interval)
  }, [])

  if (status.queueLength === 0 && !status.processing) {
    return null
  }

  return (
    <Badge variant="secondary" className="gap-1 text-xs">
      {status.processing ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          Processing AI request...
        </>
      ) : (
        <>
          <Clock className="h-3 w-3" />
          {status.queueLength} AI request{status.queueLength !== 1 ? 's' : ''} queued
        </>
      )}
    </Badge>
  )
}