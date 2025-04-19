import { Keyboard } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function KeyboardShortcuts() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Keyboard Shortcuts">
          <Keyboard className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>Keyboard shortcuts to help you work faster</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Editor</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Save</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + S</kbd>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">Formatting</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex justify-between">
                <span>Bold</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">**text**</kbd>
              </div>
              <div className="flex justify-between">
                <span>Italic</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">*text*</kbd>
              </div>
              <div className="flex justify-between">
                <span>Heading 1</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs"># text</kbd>
              </div>
              <div className="flex justify-between">
                <span>Heading 2</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">## text</kbd>
              </div>
              <div className="flex justify-between">
                <span>List</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">- item</kbd>
              </div>
              <div className="flex justify-between">
                <span>Numbered List</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">1. item</kbd>
              </div>
              <div className="flex justify-between">
                <span>Code Block</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">\`\`\`code\`\`\`</kbd>
              </div>
              <div className="flex justify-between">
                <span>Link</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs">[text](url)</kbd>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
