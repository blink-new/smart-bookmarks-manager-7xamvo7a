import { useState } from 'react'
import { Bookmark } from '../types/bookmark'
import { ShareOptions } from '../types/sharing'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Switch } from './ui/switch'
import { Separator } from './ui/separator'
import { Badge } from './ui/badge'
import { useToast } from '../hooks/use-toast'
import { 
  Share2, 
  Mail, 
  MessageCircle, 
  Twitter, 
  Linkedin, 
  Copy, 
  Globe, 
  Clock,
  Users,
  Link,
  Check
} from 'lucide-react'

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookmark?: Bookmark
  bookmarks?: Bookmark[] // For sharing collections
  type: 'single' | 'collection'
}

export function ShareDialog({ open, onOpenChange, bookmark, bookmarks, type }: ShareDialogProps) {
  const [shareOptions, setShareOptions] = useState<ShareOptions>({
    type: 'copy',
    title: bookmark?.title || 'My Bookmark Collection',
    description: bookmark?.description || 'Check out these bookmarks I found useful!',
    expiresIn: 24
  })
  const [isPublic, setIsPublic] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [isSharing, setIsSharing] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const generateShareUrl = async () => {
    setIsSharing(true)
    try {
      // Generate unique share token
      const shareToken = Math.random().toString(36).substring(2, 15)
      const baseUrl = window.location.origin
      const url = `${baseUrl}/shared/${shareToken}`
      
      // TODO: Save to database
      setShareUrl(url)
      
      toast({
        title: "Share link generated!",
        description: "Your bookmark is ready to share."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate share link.",
        variant: "destructive"
      })
    } finally {
      setIsSharing(false)
    }
  }

  const handleShare = async (platform: ShareOptions['type']) => {
    if (!shareUrl && platform !== 'copy') {
      await generateShareUrl()
    }

    const title = shareOptions.title || (bookmark?.title || 'Check out this bookmark!')
    const description = shareOptions.description || (bookmark?.description || '')
    const url = shareUrl || bookmark?.url || ''

    switch (platform) {
      case 'email': {
        const emailSubject = encodeURIComponent(title)
        const emailBody = encodeURIComponent(`${description}\n\n${url}`)
        window.open(`mailto:?subject=${emailSubject}&body=${emailBody}`)
        break
      }
        
      case 'whatsapp': {
        const whatsappText = encodeURIComponent(`${title}\n\n${description}\n\n${url}`)
        window.open(`https://wa.me/?text=${whatsappText}`)
        break
      }
        
      case 'twitter': {
        const twitterText = encodeURIComponent(`${title}\n\n${url}`)
        window.open(`https://twitter.com/intent/tweet?text=${twitterText}`)
        break
      }
        
      case 'linkedin': {
        const linkedinUrl = encodeURIComponent(url)
        const linkedinTitle = encodeURIComponent(title)
        const linkedinSummary = encodeURIComponent(description)
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${linkedinUrl}&title=${linkedinTitle}&summary=${linkedinSummary}`)
        break
      }
        
      case 'copy': {
        const textToCopy = shareUrl || bookmark?.url || ''
        await navigator.clipboard.writeText(textToCopy)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        toast({
          title: "Copied to clipboard!",
          description: "Share link has been copied."
        })
        break
      }
        
      case 'public': {
        await generateShareUrl()
        setIsPublic(true)
        break
      }
    }
  }

  const shareButtons = [
    { type: 'email' as const, icon: Mail, label: 'Email', color: 'bg-blue-500' },
    { type: 'whatsapp' as const, icon: MessageCircle, label: 'WhatsApp', color: 'bg-green-500' },
    { type: 'twitter' as const, icon: Twitter, label: 'Twitter', color: 'bg-sky-500' },
    { type: 'linkedin' as const, icon: Linkedin, label: 'LinkedIn', color: 'bg-blue-600' },
    { type: 'copy' as const, icon: copied ? Check : Copy, label: copied ? 'Copied!' : 'Copy Link', color: 'bg-gray-500' }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share {type === 'single' ? 'Bookmark' : 'Collection'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-start gap-3">
              {bookmark?.faviconUrl && (
                <img src={bookmark.faviconUrl} alt="" className="w-4 h-4 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm line-clamp-1">
                  {shareOptions.title}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {shareOptions.description}
                </p>
                {type === 'collection' && bookmarks && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Customize Share */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="share-title">Title</Label>
              <Input
                id="share-title"
                value={shareOptions.title}
                onChange={(e) => setShareOptions(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter share title..."
              />
            </div>
            
            <div>
              <Label htmlFor="share-description">Description</Label>
              <Textarea
                id="share-description"
                value={shareOptions.description}
                onChange={(e) => setShareOptions(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Add a description..."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="public-share">Make public</Label>
              </div>
              <Switch
                id="public-share"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>

            {isPublic && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Anyone with the link can view this</span>
              </div>
            )}

            <div>
              <Label htmlFor="expires">Expires in</Label>
              <Select 
                value={shareOptions.expiresIn?.toString()} 
                onValueChange={(value) => setShareOptions(prev => ({ ...prev, expiresIn: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="168">1 week</SelectItem>
                  <SelectItem value="720">1 month</SelectItem>
                  <SelectItem value="0">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Share Buttons */}
          <div className="space-y-4">
            <Label>Share via</Label>
            <div className="grid grid-cols-2 gap-3">
              {shareButtons.map((button) => (
                <Button
                  key={button.type}
                  variant="outline"
                  className="h-12 flex items-center gap-3 justify-start"
                  onClick={() => handleShare(button.type)}
                  disabled={isSharing}
                >
                  <div className={`p-1.5 rounded ${button.color} text-white`}>
                    <button.icon className="h-3 w-3" />
                  </div>
                  <span className="text-sm">{button.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Generated Link */}
          {shareUrl && (
            <div className="space-y-2">
              <Label>Share Link</Label>
              <div className="flex items-center gap-2">
                <Input value={shareUrl} readOnly className="text-xs" />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleShare('copy')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  {shareOptions.expiresIn === 0 
                    ? 'Never expires' 
                    : `Expires in ${shareOptions.expiresIn} hour${shareOptions.expiresIn !== 1 ? 's' : ''}`
                  }
                </span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}