import { useState } from 'react'
import { Bookmark } from '../types/bookmark'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { 
  ExternalLink, 
  Star, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Copy,
  Eye,
  Calendar,
  Share2
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface BookmarkCardProps {
  bookmark: Bookmark
  searchQuery?: string
  onShare?: (bookmark: Bookmark) => void
}

export function BookmarkCard({ bookmark, searchQuery, onShare }: BookmarkCardProps) {
  const [isFavorite, setIsFavorite] = useState(bookmark.isFavorite)

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsFavorite(!isFavorite)
    // TODO: Update in database
  }

  const handleOpenLink = () => {
    window.open(bookmark.url, '_blank', 'noopener,noreferrer')
    // TODO: Update visit count and last visited
  }

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(bookmark.url)
    // TODO: Show toast notification
  }

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onShare?.(bookmark)
  }

  const highlightText = (text: string, query?: string) => {
    if (!query) return text
    
    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-accent/30 text-accent-foreground rounded px-0.5">
          {part}
        </mark>
      ) : part
    )
  }

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`
    } catch {
      return null
    }
  }

  return (
    <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer" onClick={handleOpenLink}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 mt-0.5">
              {bookmark.faviconUrl || getFaviconUrl(bookmark.url) ? (
                <img 
                  src={bookmark.faviconUrl || getFaviconUrl(bookmark.url)!} 
                  alt="" 
                  className="w-4 h-4"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-4 h-4 bg-muted rounded-sm" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm leading-tight mb-1 line-clamp-2">
                {highlightText(bookmark.title, searchQuery)}
              </h3>
              
              {bookmark.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {highlightText(bookmark.description, searchQuery)}
                </p>
              )}
              
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                <span className="truncate">{new URL(bookmark.url).hostname}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {bookmark.visitCount}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              className={`h-7 w-7 p-0 ${isFavorite ? 'text-yellow-500' : 'text-muted-foreground'}`}
              onClick={handleToggleFavorite}
            >
              <Star className={`h-3 w-3 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 w-7 p-0 text-muted-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={handleOpenLink}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyUrl}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy URL
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {bookmark.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
                {highlightText(tag, searchQuery)}
              </Badge>
            ))}
            {bookmark.tags.length > 2 && (
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                +{bookmark.tags.length - 2}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatDistanceToNow(new Date(bookmark.createdAt), { addSuffix: true })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}