import { blink } from '../blink/client'
import { withRateLimit } from './rateLimiter'

export interface ProcessedUrl {
  url: string
  title: string
  description: string
  faviconUrl: string
  success: boolean
  error?: string
}

export async function processUrlsInBatches(
  urls: string[], 
  onProgress?: (processed: number, total: number) => void
): Promise<ProcessedUrl[]> {
  const results: ProcessedUrl[] = []
  const batchSize = 3 // Process 3 URLs at a time to avoid overwhelming the API
  
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize)
    
    // Process batch in parallel but with rate limiting
    const batchPromises = batch.map(url => processUrl(url))
    const batchResults = await Promise.allSettled(batchPromises)
    
    // Convert results
    batchResults.forEach((result, index) => {
      const url = batch[index]
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        results.push({
          url,
          title: extractTitleFromUrl(url),
          description: '',
          faviconUrl: getFaviconUrl(url),
          success: false,
          error: result.reason?.message || 'Failed to process URL'
        })
      }
    })
    
    // Update progress
    if (onProgress) {
      onProgress(Math.min(i + batchSize, urls.length), urls.length)
    }
    
    // Add delay between batches to be respectful
    if (i + batchSize < urls.length) {
      await delay(1000)
    }
  }
  
  return results
}

async function processUrl(url: string): Promise<ProcessedUrl> {
  try {
    // Use rate-limited data extraction
    const result = await withRateLimit(async () => {
      try {
        // Try to scrape the URL for metadata
        const scraped = await blink.data.scrape(url)
        return {
          title: scraped.metadata?.title || extractTitleFromUrl(url),
          description: scraped.metadata?.description || scraped.extract?.headings?.[0] || '',
          faviconUrl: getFaviconUrl(url)
        }
      } catch (scrapeError) {
        // If scraping fails, fall back to basic URL parsing
        console.warn(`Failed to scrape ${url}, using fallback:`, scrapeError)
        return {
          title: extractTitleFromUrl(url),
          description: '',
          faviconUrl: getFaviconUrl(url)
        }
      }
    })
    
    return {
      url,
      title: result.title,
      description: result.description,
      faviconUrl: result.faviconUrl,
      success: true
    }
  } catch (error: any) {
    console.error(`Failed to process URL ${url}:`, error)
    
    return {
      url,
      title: extractTitleFromUrl(url),
      description: '',
      faviconUrl: getFaviconUrl(url),
      success: false,
      error: error.message
    }
  }
}

function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.replace('www.', '')
    const pathname = urlObj.pathname
    
    if (pathname === '/' || pathname === '') {
      return hostname
    }
    
    // Extract meaningful parts from the path
    const pathParts = pathname.split('/').filter(part => part && part !== 'index.html')
    const lastPart = pathParts[pathParts.length - 1]
    
    if (lastPart) {
      // Clean up the last part (remove file extensions, replace dashes/underscores)
      const cleaned = lastPart
        .replace(/\.[^.]+$/, '') // Remove file extension
        .replace(/[-_]/g, ' ') // Replace dashes and underscores with spaces
        .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize words
      
      return `${cleaned} - ${hostname}`
    }
    
    return hostname
  } catch {
    return url
  }
}

function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`
  } catch {
    return ''
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Helper function to validate URLs
export function validateUrls(text: string): string[] {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line)
  const validUrls: string[] = []
  
  for (const line of lines) {
    try {
      // Try to create URL object to validate
      const url = new URL(line)
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        validUrls.push(line)
      }
    } catch {
      // Try adding https:// if it looks like a domain
      if (line.includes('.') && !line.includes(' ') && !line.startsWith('http')) {
        try {
          const url = new URL(`https://${line}`)
          validUrls.push(url.toString())
        } catch {
          // Skip invalid URLs
        }
      }
    }
  }
  
  return validUrls
}