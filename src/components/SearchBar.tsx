import { useState, useEffect, useRef } from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Search, Sparkles, Loader2 } from 'lucide-react'
import { RateLimitStatus } from './RateLimitStatus'

interface SearchBarProps {
  onSearch: (query: string) => void
  isSearching: boolean
  placeholder?: string
}

export function SearchBar({ onSearch, isSearching, placeholder = "Search bookmarks..." }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const debounceRef = useRef<NodeJS.Timeout>()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    // Only trigger search on Enter key or when user stops typing for 800ms
    // This prevents blocking the user's typing
    if (!value.trim()) {
      onSearch('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (query.trim()) {
        onSearch(query)
      }
    }
  }

  // Optional: Add debounced search for better UX (but don't block typing)
  useEffect(() => {
    if (query.trim()) {
      debounceRef.current = setTimeout(() => {
        onSearch(query)
      }, 800) // Longer delay to not interfere with typing
    }
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, onSearch])

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative flex items-center">
        <div className="absolute left-3 flex items-center gap-2 text-muted-foreground">
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </div>
        
        <Input
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-20 h-12 text-base bg-background border-2 focus:border-primary transition-colors"
          disabled={isSearching}
        />
        
        <Button 
          type="submit" 
          size="sm" 
          className="absolute right-2 h-8"
          disabled={isSearching || !query.trim()}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="mt-2 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {isSearching ? (
            <p>🔍 Searching your bookmarks with AI...</p>
          ) : (
            <p>💡 Try: "Do I have a bookmark about connection timeouts?" or "Show me React tutorials" (Press Enter to search)</p>
          )}
        </div>
        <RateLimitStatus />
      </div>
    </form>
  )
}