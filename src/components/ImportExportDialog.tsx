import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Progress } from './ui/progress'
import { Alert, AlertDescription } from './ui/alert'
import { blink } from '../blink/client'
import { withRateLimit } from '../utils/rateLimiter'
import { 
  Upload, 
  Download, 
  FileText, 
  Chrome, 
  Globe,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface ImportExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete?: () => void
}

export function ImportExportDialog({ open, onOpenChange, onImportComplete }: ImportExportDialogProps) {
  const [importProgress, setImportProgress] = useState(0)
  const [isImporting, setIsImporting] = useState(false)
  const [importResults, setImportResults] = useState<{
    total: number
    imported: number
    duplicates: number
    errors: number
  } | null>(null)
  const [urlsToImport, setUrlsToImport] = useState('')
  const [exportStats, setExportStats] = useState({
    totalBookmarks: 0,
    categories: 0,
    favorites: 0
  })

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportProgress(0)
    setImportResults(null)

    try {
      const user = await blink.auth.me()
      if (!user) {
        throw new Error('User not authenticated')
      }

      setImportProgress(10)
      
      // Read file content
      const fileContent = await file.text()
      setImportProgress(20)

      let bookmarksToImport: any[] = []

      // Parse different file formats
      if (file.name.endsWith('.json')) {
        const jsonData = JSON.parse(fileContent)
        bookmarksToImport = Array.isArray(jsonData) ? jsonData : jsonData.bookmarks || []
      } else if (file.name.endsWith('.html')) {
        // Parse HTML bookmark file (Netscape format)
        const parser = new DOMParser()
        const doc = parser.parseFromString(fileContent, 'text/html')
        const links = doc.querySelectorAll('a[href]')
        
        bookmarksToImport = Array.from(links).map((link, index) => ({
          title: link.textContent || `Bookmark ${index + 1}`,
          url: link.getAttribute('href'),
          description: link.getAttribute('description') || '',
          category: 'imported'
        }))
      } else if (file.name.endsWith('.csv')) {
        // Parse CSV format
        const lines = fileContent.split('\n').filter(line => line.trim())
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
        
        bookmarksToImport = lines.slice(1).map(line => {
          const values = line.split(',')
          const bookmark: any = {}
          headers.forEach((header, index) => {
            if (header.includes('title')) bookmark.title = values[index]?.trim()
            if (header.includes('url')) bookmark.url = values[index]?.trim()
            if (header.includes('description')) bookmark.description = values[index]?.trim()
            if (header.includes('category')) bookmark.category = values[index]?.trim()
          })
          return bookmark
        })
      }

      setImportProgress(40)

      // Get existing bookmarks to check for duplicates
      const existingBookmarks = await blink.db.bookmarks.list({
        where: { userId: user.id }
      })
      
      const existingUrls = new Set(existingBookmarks.map(b => b.url))
      
      setImportProgress(60)

      // Filter out duplicates and invalid bookmarks
      const validBookmarks = bookmarksToImport.filter(bookmark => 
        bookmark.url && 
        bookmark.title && 
        !existingUrls.has(bookmark.url)
      )

      setImportProgress(80)

      // Import bookmarks to database
      let imported = 0
      let errors = 0

      for (const bookmark of validBookmarks) {
        try {
          await blink.db.bookmarks.create({
            userId: user.id,
            title: bookmark.title,
            url: bookmark.url,
            description: bookmark.description || '',
            faviconUrl: bookmark.faviconUrl || '',
            category: bookmark.category || 'imported',
            tags: JSON.stringify(bookmark.tags || []),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isFavorite: '0',
            visitCount: 0,
            lastVisited: new Date().toISOString()
          })
          imported++
        } catch (error) {
          console.error('Failed to import bookmark:', bookmark, error)
          errors++
        }
      }

      setImportProgress(100)

      setImportResults({
        total: bookmarksToImport.length,
        imported,
        duplicates: bookmarksToImport.length - validBookmarks.length,
        errors
      })

      // Notify parent component to refresh bookmarks
      if (onImportComplete) {
        onImportComplete()
      }

    } catch (error) {
      console.error('Import failed:', error)
      setImportResults({
        total: 0,
        imported: 0,
        duplicates: 0,
        errors: 1
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleUrlImport = async () => {
    if (!urlsToImport.trim()) return

    setIsImporting(true)
    setImportProgress(0)
    setImportResults(null)

    try {
      const user = await blink.auth.me()
      if (!user) {
        throw new Error('User not authenticated')
      }

      setImportProgress(10)

      // Validate and parse URLs from textarea
      const { validateUrls } = await import('../utils/urlProcessor')
      const urls = validateUrls(urlsToImport)

      if (urls.length === 0) {
        throw new Error('No valid URLs found')
      }

      setImportProgress(20)

      // Get existing bookmarks to check for duplicates
      const existingBookmarks = await blink.db.bookmarks.list({
        where: { userId: user.id }
      })
      
      const existingUrls = new Set(existingBookmarks.map(b => b.url))
      const newUrls = urls.filter(url => !existingUrls.has(url))

      setImportProgress(30)

      if (newUrls.length === 0) {
        setImportResults({
          total: urls.length,
          imported: 0,
          duplicates: urls.length,
          errors: 0
        })
        return
      }

      // Process URLs with metadata extraction (rate-limited)
      const { processUrlsInBatches } = await import('../utils/urlProcessor')
      const processedUrls = await processUrlsInBatches(newUrls, (processed, total) => {
        // Update progress: 30% + (processed/total * 60%)
        const progressPercent = 30 + Math.floor((processed / total) * 60)
        setImportProgress(progressPercent)
      })

      setImportProgress(90)

      // Import processed URLs to database
      let imported = 0
      let errors = 0

      for (const processedUrl of processedUrls) {
        try {
          await blink.db.bookmarks.create({
            userId: user.id,
            title: processedUrl.title,
            url: processedUrl.url,
            description: processedUrl.description,
            faviconUrl: processedUrl.faviconUrl,
            category: 'imported',
            tags: JSON.stringify([]),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isFavorite: '0',
            visitCount: 0,
            lastVisited: new Date().toISOString()
          })
          imported++
        } catch (error) {
          console.error('Failed to save bookmark:', processedUrl.url, error)
          errors++
        }
      }

      setImportProgress(100)

      setImportResults({
        total: urls.length,
        imported,
        duplicates: urls.length - newUrls.length,
        errors
      })

      // Clear the textarea and notify parent
      setUrlsToImport('')
      if (onImportComplete) {
        onImportComplete()
      }

    } catch (error: any) {
      console.error('URL import failed:', error)
      setImportResults({
        total: 0,
        imported: 0,
        duplicates: 0,
        errors: 1
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleExport = async (format: 'json' | 'html' | 'csv') => {
    try {
      const user = await blink.auth.me()
      if (!user) return

      // Get user's bookmarks
      const bookmarks = await blink.db.bookmarks.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })

      let data = ''
      
      if (format === 'json') {
        data = JSON.stringify({ bookmarks }, null, 2)
      } else if (format === 'html') {
        data = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
${bookmarks.map(bookmark => 
  `    <DT><A HREF="${bookmark.url}">${bookmark.title}</A>`
).join('\n')}
</DL><p>`
      } else if (format === 'csv') {
        data = 'Title,URL,Description,Category,Tags\n' + 
          bookmarks.map(bookmark => 
            `"${bookmark.title}","${bookmark.url}","${bookmark.description}","${bookmark.category}","${bookmark.tags}"`
          ).join('\n')
      }

      const blob = new Blob([data], { 
        type: format === 'json' ? 'application/json' : 
             format === 'html' ? 'text/html' : 'text/csv' 
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bookmarks.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  // Load export stats when dialog opens
  useEffect(() => {
    if (open) {
      loadExportStats()
    }
  }, [open])

  const loadExportStats = async () => {
    try {
      const user = await blink.auth.me()
      if (!user) return

      const bookmarks = await blink.db.bookmarks.list({
        where: { userId: user.id }
      })

      const categories = await blink.db.categories.list({
        where: { userId: user.id }
      })

      setExportStats({
        totalBookmarks: bookmarks.length,
        categories: categories.length,
        favorites: bookmarks.filter(b => Number(b.isFavorite) > 0).length
      })
    } catch (error) {
      console.error('Failed to load export stats:', error)
    }
  }

  const ExportSummary = () => (
    <div className="bg-muted/50 p-4 rounded-lg">
      <h4 className="font-medium mb-2">Export Summary</h4>
      <div className="text-sm text-muted-foreground space-y-1">
        <div className="flex justify-between">
          <span>Total Bookmarks:</span>
          <span>{exportStats.totalBookmarks}</span>
        </div>
        <div className="flex justify-between">
          <span>Categories:</span>
          <span>{exportStats.categories}</span>
        </div>
        <div className="flex justify-between">
          <span>Favorites:</span>
          <span>{exportStats.favorites}</span>
        </div>
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import & Export Bookmarks</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="import" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import" className="gap-2">
              <Upload className="h-4 w-4" />
              Import
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Import from Browser</h3>
                <div className="grid grid-cols-3 gap-3">
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Chrome className="h-6 w-6" />
                    Chrome
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Globe className="h-6 w-6" />
                    Firefox
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Globe className="h-6 w-6" />
                    Safari
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Click to get browser-specific import instructions
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Import from File</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="file-upload">Choose bookmark file</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".html,.json,.csv"
                      onChange={handleFileImport}
                      disabled={isImporting}
                      className="mt-1"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Supports HTML, JSON, and CSV formats
                    </p>
                  </div>

                  {isImporting && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Processing bookmarks...</span>
                      </div>
                      <Progress value={importProgress} className="w-full" />
                    </div>
                  )}

                  {importResults && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Import completed! {importResults.imported} bookmarks imported, 
                        {importResults.duplicates} duplicates removed, 
                        {importResults.errors} errors.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Import from URLs</h3>
                <div className="space-y-2">
                  <Label htmlFor="urls">Paste URLs (one per line)</Label>
                  <Textarea
                    id="urls"
                    value={urlsToImport}
                    onChange={(e) => setUrlsToImport(e.target.value)}
                    placeholder="https://example.com&#10;https://another-site.com&#10;..."
                    className="min-h-[100px]"
                    disabled={isImporting}
                  />
                  <Button 
                    className="w-full" 
                    onClick={handleUrlImport}
                    disabled={isImporting || !urlsToImport.trim()}
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Importing URLs...
                      </>
                    ) : (
                      'Import URLs'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Export Format</h3>
                <div className="grid grid-cols-3 gap-3">
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => handleExport('json')}
                  >
                    <FileText className="h-6 w-6" />
                    JSON
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => handleExport('html')}
                  >
                    <FileText className="h-6 w-6" />
                    HTML
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2"
                    onClick={() => handleExport('csv')}
                  >
                    <FileText className="h-6 w-6" />
                    CSV
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your bookmarks will be exported with all metadata including categories, 
                  tags, and visit statistics.
                </AlertDescription>
              </Alert>

              <ExportSummary />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}