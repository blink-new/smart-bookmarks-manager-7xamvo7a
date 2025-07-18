import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import { Category, Bookmark } from '../types/bookmark'
import { 
  Folder, 
  Code, 
  Book, 
  Wrench, 
  Star, 
  Clock, 
  Plus,
  Hash
} from 'lucide-react'

interface CategorySidebarProps {
  categories: Category[]
  selectedCategory: string | null
  onSelectCategory: (categoryId: string | null) => void
  bookmarks: Bookmark[]
}

const iconMap = {
  folder: Folder,
  code: Code,
  book: Book,
  wrench: Wrench,
  star: Star,
  clock: Clock,
  hash: Hash
}

export function CategorySidebar({ 
  categories, 
  selectedCategory, 
  onSelectCategory, 
  bookmarks 
}: CategorySidebarProps) {
  const getBookmarkCount = (categoryId?: string) => {
    if (!categoryId) return bookmarks.length
    return bookmarks.filter(b => b.category === categoryId).length
  }

  const favoriteCount = bookmarks.filter(b => b.isFavorite).length
  const recentCount = bookmarks.filter(b => {
    const lastVisited = new Date(b.lastVisited || 0)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return lastVisited > weekAgo
  }).length

  return (
    <aside className="w-64 border-r bg-card flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Quick Access
          </h2>
        </div>
        
        <div className="space-y-1">
          <Button
            variant={selectedCategory === null ? "secondary" : "ghost"}
            className="w-full justify-start gap-2 h-9"
            onClick={() => onSelectCategory(null)}
          >
            <Folder className="h-4 w-4" />
            All Bookmarks
            <Badge variant="secondary" className="ml-auto">
              {bookmarks.length}
            </Badge>
          </Button>
          
          <Button
            variant={selectedCategory === 'favorites' ? "secondary" : "ghost"}
            className="w-full justify-start gap-2 h-9"
            onClick={() => onSelectCategory('favorites')}
          >
            <Star className="h-4 w-4" />
            Favorites
            <Badge variant="secondary" className="ml-auto">
              {favoriteCount}
            </Badge>
          </Button>
          
          <Button
            variant={selectedCategory === 'recent' ? "secondary" : "ghost"}
            className="w-full justify-start gap-2 h-9"
            onClick={() => onSelectCategory('recent')}
          >
            <Clock className="h-4 w-4" />
            Recent
            <Badge variant="secondary" className="ml-auto">
              {recentCount}
            </Badge>
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Categories
          </h2>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <div className="space-y-1">
            {categories.map((category) => {
              const IconComponent = iconMap[category.icon as keyof typeof iconMap] || Folder
              const count = getBookmarkCount(category.id)
              
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "secondary" : "ghost"}
                  className="w-full justify-start gap-2 h-9"
                  onClick={() => onSelectCategory(category.id)}
                >
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  />
                  <IconComponent className="h-4 w-4" />
                  {category.name}
                  <Badge variant="secondary" className="ml-auto">
                    {count}
                  </Badge>
                </Button>
              )
            })}
          </div>
        </ScrollArea>
      </div>
      
      <div className="p-4 border-t">
        <Button variant="outline" className="w-full gap-2" size="sm">
          <Plus className="h-4 w-4" />
          New Category
        </Button>
      </div>
    </aside>
  )
}