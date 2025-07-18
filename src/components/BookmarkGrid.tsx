import { Bookmark } from '../types/bookmark'
import { BookmarkCard } from './BookmarkCard'
import { Skeleton } from './ui/skeleton'
import { Search } from 'lucide-react'

interface BookmarkGridProps {
  bookmarks: Bookmark[]
  isLoading: boolean
  searchQuery?: string
  onShare?: (bookmark: Bookmark) => void
}

export function BookmarkGrid({ bookmarks, isLoading, searchQuery, onShare }: BookmarkGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-start gap-3">
              <Skeleton className="h-4 w-4 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          {searchQuery ? 'No bookmarks found' : 'No bookmarks yet'}
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          {searchQuery 
            ? `No bookmarks match "${searchQuery}". Try a different search term or add some bookmarks first.`
            : 'Start building your bookmark collection by adding your first bookmark.'
          }
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {bookmarks.map((bookmark) => (
        <BookmarkCard 
          key={bookmark.id} 
          bookmark={bookmark}
          searchQuery={searchQuery}
          onShare={onShare}
        />
      ))}
    </div>
  )
}