import { useState, useEffect, useCallback } from 'react'
import { blink } from '../blink/client'
import { Bookmark } from '../types/bookmark'
import { SearchBar } from './SearchBar'
import { BookmarkCard } from './BookmarkCard'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'
import { 
  Clock, 
  Star, 
  TrendingUp, 
  Search, 
  ExternalLink,
  Sparkles,
  Globe
} from 'lucide-react'

interface NewTabPageProps {
  onShare?: (bookmark: Bookmark) => void
}

export function NewTabPage({ onShare }: NewTabPageProps) {
  const [user, setUser] = useState(null)
  const [recentBookmarks, setRecentBookmarks] = useState<Bookmark[]>([])
  const [favoriteBookmarks, setFavoriteBookmarks] = useState<Bookmark[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Bookmark[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user) {
        loadBookmarks()
      }
    })
    return unsubscribe
  }, [loadBookmarks])

  const loadBookmarks = useCallback(async () => {
    try {
      // Mock data for now - replace with actual DB calls
      const mockBookmarks: Bookmark[] = [
        {
          id: '1',
          userId: user?.id || '',
          title: 'React Documentation',
          url: 'https://react.dev',
          description: 'The official React documentation with guides and API reference',
          faviconUrl: 'https://react.dev/favicon.ico',
          category: 'development',
          tags: ['react', 'javascript', 'frontend'],
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          updatedAt: new Date().toISOString(),
          isFavorite: true,
          visitCount: 15,
          lastVisited: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
        },
        {
          id: '2',
          userId: user?.id || '',
          title: 'Tailwind CSS',
          url: 'https://tailwindcss.com',
          description: 'A utility-first CSS framework for rapidly building custom user interfaces',
          faviconUrl: 'https://tailwindcss.com/favicon.ico',
          category: 'development',
          tags: ['css', 'tailwind', 'styling'],
          createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          updatedAt: new Date().toISOString(),
          isFavorite: false,
          visitCount: 8,
          lastVisited: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
        },
        {
          id: '3',
          userId: user?.id || '',
          title: 'Connection Timeout Best Practices',
          url: 'https://example.com/timeout-blog',
          description: 'A comprehensive guide on handling connection timeouts in web applications',
          faviconUrl: 'https://example.com/favicon.ico',
          category: 'tutorials',
          tags: ['networking', 'timeout', 'best-practices'],
          createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          updatedAt: new Date().toISOString(),
          isFavorite: true,
          visitCount: 3,
          lastVisited: new Date(Date.now() - 86400000).toISOString() // 1 day ago
        }
      ]

      // Sort by last visited for recent
      const recent = [...mockBookmarks]
        .sort((a, b) => new Date(b.lastVisited || 0).getTime() - new Date(a.lastVisited || 0).getTime())
        .slice(0, 6)
      
      // Filter favorites
      const favorites = mockBookmarks.filter(b => b.isFavorite).slice(0, 4)
      
      setRecentBookmarks(recent)
      setFavoriteBookmarks(favorites)
    } catch (error) {
      console.error('Failed to load bookmarks:', error)
    }
  }, [user])

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setIsSearching(true)
    setShowSearchResults(true)
    
    try {
      // AI-powered search simulation
      const allBookmarks = [...recentBookmarks, ...favoriteBookmarks]
      const filtered = allBookmarks.filter(bookmark => 
        bookmark.title.toLowerCase().includes(query.toLowerCase()) ||
        bookmark.description?.toLowerCase().includes(query.toLowerCase()) ||
        bookmark.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())) ||
        bookmark.url.toLowerCase().includes(query.toLowerCase())
      )
      
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 800))
      setSearchResults(filtered)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleGoogleSearch = () => {
    if (searchQuery.trim()) {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank')
    }
  }

  const quickActions = [
    { label: 'React tutorials', icon: '⚛️' },
    { label: 'CSS frameworks', icon: '🎨' },
    { label: 'JavaScript guides', icon: '📚' },
    { label: 'Design inspiration', icon: '✨' }
  ]

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Smart Bookmarks</h1>
          <p className="text-muted-foreground mb-6">
            Your AI-powered bookmark manager. Search your bookmarks with natural language.
          </p>
          <Button onClick={() => blink.auth.login()} size="lg">
            Sign In to Continue
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Smart Bookmarks</h1>
          </div>
          <p className="text-lg text-muted-foreground mb-8">
            What are you looking for today?
          </p>
          
          {/* AI Search Bar */}
          <div className="max-w-2xl mx-auto mb-6">
            <SearchBar 
              onSearch={handleSearch}
              isSearching={isSearching}
              placeholder="Ask me anything about your bookmarks... or search the web"
            />
          </div>

          {/* Search Results or Fallback */}
          {showSearchResults && (
            <div className="max-w-2xl mx-auto mb-8">
              {searchResults.length > 0 ? (
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Found in your bookmarks</h3>
                    <Badge variant="secondary">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</Badge>
                  </div>
                  <div className="space-y-3">
                    {searchResults.slice(0, 3).map((bookmark) => (
                      <div key={bookmark.id} className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer"
                           onClick={() => window.open(bookmark.url, '_blank')}>
                        <img src={bookmark.faviconUrl} alt="" className="w-4 h-4" />
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">{bookmark.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{bookmark.description}</div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : !isSearching && (
                <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                  <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">
                    No bookmarks found for "{searchQuery}"
                  </p>
                  <Button onClick={handleGoogleSearch} variant="outline" className="gap-2">
                    <Globe className="h-4 w-4" />
                    Search on Google instead
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          {!showSearchResults && (
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground mr-2">Try:</span>
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs"
                  onClick={() => handleSearch(action.label)}
                >
                  <span>{action.icon}</span>
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Content Sections */}
        {!showSearchResults && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Bookmarks */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Recently Visited</h2>
              </div>
              <div className="space-y-3">
                {recentBookmarks.slice(0, 4).map((bookmark) => (
                  <Card key={bookmark.id} className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => window.open(bookmark.url, '_blank')}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <img src={bookmark.faviconUrl} alt="" className="w-4 h-4 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm line-clamp-1">{bookmark.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                            {bookmark.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">{bookmark.category}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {bookmark.visitCount} visits
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Favorite Bookmarks */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-yellow-500" />
                <h2 className="text-xl font-semibold">Favorites</h2>
              </div>
              <div className="space-y-3">
                {favoriteBookmarks.map((bookmark) => (
                  <Card key={bookmark.id} className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => window.open(bookmark.url, '_blank')}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <img src={bookmark.faviconUrl} alt="" className="w-4 h-4 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm line-clamp-1">{bookmark.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                            {bookmark.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">{bookmark.category}</Badge>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500 fill-current" />
                              <span className="text-xs text-muted-foreground">Favorite</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            Powered by AI • {recentBookmarks.length + favoriteBookmarks.length} bookmarks managed
          </p>
        </div>
      </div>
    </div>
  )
}