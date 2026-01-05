import { ReactNode, useState } from 'react'
import { Sidebar } from './Sidebar'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
      <main 
        className="flex-1 transition-all duration-300 ease-in-out"
        style={{ marginLeft: isCollapsed ? '80px' : '256px' }}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}

