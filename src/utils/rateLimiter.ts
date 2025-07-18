interface QueueItem {
  fn: () => Promise<any>
  resolve: (value: any) => void
  reject: (error: any) => void
  retries: number
}

class RateLimiter {
  private queue: QueueItem[] = []
  private processing = false
  private lastRequestTime = 0
  private minInterval = 1000 // Minimum 1 second between requests
  private maxRetries = 3
  private baseDelay = 2000 // Base delay for exponential backoff

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        fn,
        resolve,
        reject,
        retries: 0
      })
      
      if (!this.processing) {
        this.processQueue()
      }
    })
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true

    while (this.queue.length > 0) {
      const item = this.queue.shift()!
      
      try {
        // Ensure minimum interval between requests
        const now = Date.now()
        const timeSinceLastRequest = now - this.lastRequestTime
        if (timeSinceLastRequest < this.minInterval) {
          await this.delay(this.minInterval - timeSinceLastRequest)
        }

        this.lastRequestTime = Date.now()
        const result = await item.fn()
        item.resolve(result)
      } catch (error: any) {
        // Check if it's a rate limit error
        if (this.isRateLimitError(error) && item.retries < this.maxRetries) {
          // Calculate exponential backoff delay
          const delay = this.baseDelay * Math.pow(2, item.retries)
          console.log(`Rate limited, retrying in ${delay}ms (attempt ${item.retries + 1}/${this.maxRetries})`)
          
          // Wait for the specified delay
          await this.delay(delay)
          
          // Increment retries and add back to front of queue
          item.retries++
          this.queue.unshift(item)
        } else {
          item.reject(error)
        }
      }
    }

    this.processing = false
  }

  private isRateLimitError(error: any): boolean {
    return error?.message?.includes('Rate limit exceeded') ||
           error?.code === 'RATE_LIMIT_EXCEEDED' ||
           error?.status === 429
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Get queue status for UI feedback
  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing
    }
  }

  // Clear the queue (useful for canceling pending requests)
  clear() {
    this.queue.forEach(item => {
      item.reject(new Error('Request cancelled'))
    })
    this.queue = []
  }
}

// Create a singleton instance
export const aiRateLimiter = new RateLimiter()

// Helper function to wrap AI calls
export async function withRateLimit<T>(fn: () => Promise<T>): Promise<T> {
  return aiRateLimiter.add(fn)
}