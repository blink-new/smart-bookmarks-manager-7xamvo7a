export interface SharedBookmark {
  id: string
  bookmarkId: string
  sharedByUserId: string
  sharedWithUserId?: string
  shareType: 'public' | 'private' | 'link'
  shareToken: string
  title?: string
  description?: string
  expiresAt?: string
  createdAt: string
}

export interface BookmarkCollection {
  id: string
  userId: string
  name: string
  description?: string
  isPublic: boolean
  shareToken?: string
  createdAt: string
  updatedAt: string
  bookmarks?: string[] // bookmark IDs
}

export interface ShareOptions {
  type: 'email' | 'whatsapp' | 'twitter' | 'linkedin' | 'copy' | 'public'
  title?: string
  description?: string
  expiresIn?: number // hours
}