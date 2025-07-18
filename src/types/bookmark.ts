export interface Bookmark {
  id: string
  userId: string
  title: string
  url: string
  description?: string
  faviconUrl?: string
  category?: string
  tags: string[]
  createdAt: string
  updatedAt: string
  isFavorite: boolean
  visitCount: number
  lastVisited?: string
}

export interface Category {
  id: string
  userId: string
  name: string
  color: string
  icon: string
  createdAt: string
  updatedAt: string
}

export interface SearchResult {
  bookmark: Bookmark
  snippet: string
  relevanceScore: number
}