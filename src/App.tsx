import { useState, useEffect } from 'react'
import { blink } from './blink/client'
import { Bookmark, Category } from './types/bookmark'
import { Header } from './components/Header'
import { SearchBar } from './components/SearchBar'
import { BookmarkGrid } from './components/BookmarkGrid'
import { CategorySidebar } from './components/CategorySidebar'
import { ImportExportDialog } from './components/ImportExportDialog'
import { ShareDialog } from './components/ShareDialog'
import { NewTabPage } from './components/NewTabPage'
import { Toaster } from './components/ui/toaster'
import { useToast } from './hooks/use-toast'
import { Button } from './components/ui/button'
import { Plus, Upload, Download, Share2 } from 'lucide-react'
import { withRateLimit } from './utils/rateLimiter'

function App() {
  const { toast } = useToast()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Bookmark[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showImportExport, setShowImportExport] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [bookmarkToShare, setBookmarkToShare] = useState<Bookmark | null>(null)
  const [showNewTabMode, setShowNewTabMode] = useState(false)

  // Auth state management
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  // Load user data after auth
  useEffect(() => {
    if (user) {
      loadBookmarks()
      loadCategories()
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadBookmarks = async () => {
    try {
      const bookmarksData = await blink.db.bookmarks.list({
        where: { userId: user?.id || '' },
        orderBy: { createdAt: 'desc' }
      })
      
      // Transform database data to match our interface
      const transformedBookmarks: Bookmark[] = bookmarksData.map(bookmark => ({
        id: bookmark.id,
        userId: bookmark.userId,
        title: bookmark.title,
        url: bookmark.url,
        description: bookmark.description || '',
        faviconUrl: bookmark.faviconUrl || '',
        category: bookmark.category || '',
        tags: bookmark.tags ? JSON.parse(bookmark.tags) : [],
        createdAt: bookmark.createdAt,
        updatedAt: bookmark.updatedAt,
        isFavorite: Number(bookmark.isFavorite) > 0,
        visitCount: bookmark.visitCount || 0,
        lastVisited: bookmark.lastVisited || ''
      }))
      
      setBookmarks(transformedBookmarks)
    } catch (error) {
      console.error('Failed to load bookmarks:', error)
      // Fallback to empty array
      setBookmarks([])
    }
  }

  const loadCategories = async () => {
    try {
      const categoriesData = await blink.db.categories.list({
        where: { userId: user?.id || '' },
        orderBy: { name: 'asc' }
      })
      
      // Transform database data to match our interface
      const transformedCategories: Category[] = categoriesData.map(category => ({
        id: category.id,
        userId: category.userId,
        name: category.name,
        color: category.color,
        icon: category.icon,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      }))
      
      setCategories(transformedCategories)
    } catch (error) {
      console.error('Failed to load categories:', error)
      // Fallback to empty array
      setCategories([])
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      // First, do basic text matching
      const basicFiltered = bookmarks.filter(bookmark => 
        bookmark.title.toLowerCase().includes(query.toLowerCase()) ||
        bookmark.description?.toLowerCase().includes(query.toLowerCase()) ||
        bookmark.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())) ||
        bookmark.url.toLowerCase().includes(query.toLowerCase())
      )

      // If we have basic matches, show them immediately
      if (basicFiltered.length > 0) {
        setSearchResults(basicFiltered)
      }

      // Only use AI for complex queries or when no basic matches found
      const shouldUseAI = basicFiltered.length === 0 || 
        query.includes('?') || 
        query.includes('about') || 
        query.includes('related to') ||
        query.split(' ').length > 3

      if (shouldUseAI && bookmarks.length > 0) {
        try {
          // Limit bookmarks to prevent token overflow
          const limitedBookmarks = bookmarks.slice(0, 50)
          const bookmarkTexts = limitedBookmarks.map(b => 
            `Title: ${b.title}\nDescription: ${b.description || 'No description'}\nTags: ${b.tags.join(', ') || 'No tags'}`
          ).join('\n\n')

          const aiResponse = await withRateLimit(() => 
            blink.ai.generateText({
              prompt: `User query: "${query}"

Find relevant bookmarks from this list:
${bookmarkTexts}

Return only the exact titles of matching bookmarks, one per line. If no matches, return "NO_MATCHES".`,
              maxTokens: 150,
              model: 'gpt-4o-mini' // Use faster, cheaper model for search
            })
          )

          if (aiResponse.text.includes('NO_MATCHES')) {
            // If AI found no matches but we had basic matches, keep those
            if (basicFiltered.length === 0) {
              setSearchResults([])
            }
          } else {
            const matchedTitles = aiResponse.text.split('\n').filter(line => line.trim())
            const aiFiltered = bookmarks.filter(bookmark => 
              matchedTitles.some(title => 
                bookmark.title.toLowerCase().includes(title.toLowerCase()) ||
                title.toLowerCase().includes(bookmark.title.toLowerCase())
              )
            )
            
            // Combine AI results with basic results and remove duplicates
            const combinedResults = [...new Map(
              [...basicFiltered, ...aiFiltered].map(b => [b.id, b])
            ).values()]
            
            setSearchResults(combinedResults)
          }
        } catch (aiError: any) {
          console.error('AI search failed, using basic search results:', aiError)
          
          // Show user-friendly error message for rate limits
          if (aiError?.message?.includes('Rate limit exceeded')) {
            console.log('AI search temporarily unavailable due to rate limits, showing basic results')
            toast({
              title: "AI Search Temporarily Limited",
              description: "Showing basic search results. AI search will be available again shortly.",
              variant: "default"
            })
          }
          
          // Fall back to basic results
          setSearchResults(basicFiltered)
        }
      } else {
        // For simple queries, just use basic search
        setSearchResults(basicFiltered)
      }
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleShare = (bookmark: Bookmark) => {
    setBookmarkToShare(bookmark)
    setShowShareDialog(true)
  }

  const filteredBookmarks = searchQuery 
    ? searchResults 
    : selectedCategory 
      ? bookmarks.filter(b => b.category === selectedCategory)
      : bookmarks

  // Check if we should show new tab mode (for browser extension)
  const isNewTabMode = window.location.search.includes('newtab=true') || showNewTabMode

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-3xl font-bold mb-4">Smart Bookmarks Manager</h1>
          <p className="text-muted-foreground mb-6">
            Organize and search your bookmarks with AI-powered intelligence
          </p>
          <Button onClick={() => blink.auth.login()}>
            Sign In to Continue
          </Button>
        </div>
      </div>
    )
  }

  // Show New Tab mode if requested
  if (isNewTabMode) {
    return <NewTabPage onShare={handleShare} />
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      
      <div className="flex h-[calc(100vh-4rem)]">
        <CategorySidebar 
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          bookmarks={bookmarks}
        />
        
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 border-b bg-card">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold">
                    {searchQuery ? 'Search Results' : selectedCategory ? 
                      categories.find(c => c.id === selectedCategory)?.name || 'Bookmarks' : 
                      'All Bookmarks'
                    }
                  </h1>
                  <p className="text-muted-foreground">
                    {filteredBookmarks.length} bookmark{filteredBookmarks.length !== 1 ? 's' : ''}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowImportExport(true)}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Import/Export
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowNewTabMode(true)}
                    className="gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    New Tab Mode
                  </Button>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Bookmark
                  </Button>
                </div>
              </div>
              
              <SearchBar 
                onSearch={handleSearch}
                isSearching={isSearching}
                placeholder="Ask me anything about your bookmarks..."
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-4xl mx-auto">
              <BookmarkGrid 
                bookmarks={filteredBookmarks}
                isLoading={isSearching}
                searchQuery={searchQuery}
                onShare={handleShare}
              />
            </div>
          </div>
        </main>
      </div>

      <ImportExportDialog 
        open={showImportExport}
        onOpenChange={setShowImportExport}
        onImportComplete={loadBookmarks}
      />

      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        bookmark={bookmarkToShare || undefined}
        type="single"
      />
      
      <Toaster />
    </div>
  )
}

export default App