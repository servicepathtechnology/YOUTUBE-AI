"use client"
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import Swal from 'sweetalert2'

export function ClearHistoryButton() {
  const router = useRouter()

  const handleClearHistory = async () => {
    const skipClearConfirm = localStorage.getItem('skipClearConfirm') === 'true'

    if (skipClearConfirm) {
      performClear()
      return
    }

    const result = await Swal.fire({
      title: 'Clear History?',
      text: "This will permanently remove all your video analysis and history. This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3b82f6',
      confirmButtonText: 'Yes, clear all!',
      background: '#0a0a0c',
      color: '#f4f4f5',
      customClass: {
        popup: 'border border-border rounded-xl shadow-card',
        title: 'font-headings text-xl font-bold',
        htmlContainer: 'text-text-secondary text-sm',
        confirmButton: 'rounded-lg px-6 py-2.5 font-bold',
        cancelButton: 'rounded-lg px-6 py-2.5 font-bold'
      },
      footer: `
        <div class="flex items-center gap-2">
          <input type="checkbox" id="dont-show-again-clear" class="w-4 h-4 rounded border-border bg-bg-secondary text-accent focus:ring-accent">
          <label for="dont-show-again-clear" class="text-xs text-text-muted font-medium cursor-pointer">Don't show again</label>
        </div>
      `,
      preConfirm: () => {
        const checkbox = document.getElementById('dont-show-again-clear') as HTMLInputElement
        if (checkbox?.checked) {
          localStorage.setItem('skipClearConfirm', 'true')
        }
      }
    })

    if (result.isConfirmed) {
      performClear()
    }
  }

  const performClear = async () => {
    try {
      const res = await fetch('/api/clear-history', {
        method: 'POST',
      })

      if (res.ok) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'History cleared',
          showConfirmButton: false,
          timer: 2000,
          background: '#0a0a0c',
          color: '#f4f4f5',
        })
        router.refresh()
      } else {
        throw new Error('Failed to clear history')
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to clear the history.',
        background: '#0a0a0c',
        color: '#f4f4f5',
      })
    }
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleClearHistory}
      className="text-text-muted hover:text-red-500 hover:bg-red-500/10 gap-2 font-bold text-xs"
    >
      <Trash2 className="w-4 h-4" />
      Clear History
    </Button>
  )
}
