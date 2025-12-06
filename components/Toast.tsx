'use client'

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    setToasts(prev => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // 入场动画
    requestAnimationFrame(() => {
      setIsVisible(true)
    })

    // 自动消失
    const timer = setTimeout(() => {
      setIsLeaving(true)
      setTimeout(() => {
        onRemove(toast.id)
      }, 300)
    }, 3000)

    return () => clearTimeout(timer)
  }, [toast.id, onRemove])

  const getTypeStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
      case 'error':
        return 'border-red-500/30 bg-red-500/10 text-red-200'
      case 'warning':
        return 'border-amber-500/30 bg-amber-500/10 text-amber-200'
      case 'info':
      default:
        return 'border-primary/30 bg-primary/10 text-primary-foreground'
    }
  }

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✓'
      case 'error':
        return '✕'
      case 'warning':
        return '⚠'
      case 'info':
      default:
        return 'ℹ'
    }
  }

  return (
    <div
      className={`
        pointer-events-auto flex items-center gap-3 rounded-xl border px-5 py-3.5
        backdrop-blur-md shadow-lg min-w-[280px] max-w-[400px]
        transition-all duration-300 ease-out
        ${getTypeStyles()}
        ${isVisible && !isLeaving ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}
      `}
    >
      <span className="text-lg flex-shrink-0">{getIcon()}</span>
      <span className="text-sm font-medium flex-1">{toast.message}</span>
      <button
        onClick={() => {
          setIsLeaving(true)
          setTimeout(() => onRemove(toast.id), 300)
        }}
        className="text-current opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
      >
        ✕
      </button>
    </div>
  )
}
