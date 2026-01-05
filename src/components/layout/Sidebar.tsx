import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, AlertTriangle } from 'lucide-react'
import { ReactNode } from 'react'

interface NavItem {
  path: string
  label: string
  icon: ReactNode
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { path: '/incident', label: 'Incidents', icon: <AlertTriangle size={20} /> }
]

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const location = useLocation()

  return (
    <div 
      className="fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-sm z-50 transition-all duration-300 ease-in-out"
      style={{ width: isCollapsed ? '80px' : '256px' }}
    >
      <div className="flex flex-col h-full">
        {/* Logo/Brand */}
        <div className="px-6 py-6 border-b border-gray-200 relative">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
              <img 
                src="/assets/bharatpe-logo.png" 
                alt="BharatPe Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div 
              className={`overflow-hidden transition-all duration-300 ${
                isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
              }`}
            >
              <h1 className="text-xl font-bold whitespace-nowrap">
                <span className="text-gray-900">Bharat</span>
                <span className="text-bharatpe-blue">Pe</span>
              </h1>
              <p className="text-xs text-gray-500 whitespace-nowrap">Monitoring</p>
            </div>
          </div>
          
          {/* Toggle Button */}
          <button
            onClick={onToggle}
            className={`absolute top-6 p-1.5 rounded-md hover:bg-gray-100 transition-all duration-200 text-gray-600 hover:text-gray-900 ${
              isCollapsed ? 'right-2' : 'right-4'
            }`}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center rounded-lg transition-all duration-200 group relative
                  ${
                    isCollapsed 
                      ? 'justify-center px-3 py-3' 
                      : 'space-x-3 px-4 py-3'
                  }
                  ${
                    isActive
                      ? 'bg-bharatpe-blue text-white shadow-md'
                      : 'text-gray-700 hover:bg-bharatpe-blue-light hover:text-bharatpe-blue'
                  }
                `}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span 
                  className={`font-medium transition-all duration-300 whitespace-nowrap ${
                    isCollapsed 
                      ? 'w-0 opacity-0 overflow-hidden' 
                      : 'w-auto opacity-100'
                  }`}
                >
                  {item.label}
                </span>
                
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full border-4 border-transparent border-r-gray-900"></div>
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <p 
            className={`text-xs text-gray-500 transition-all duration-300 whitespace-nowrap overflow-hidden ${
              isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
            }`}
          >
            Unified Agent Monitoring
          </p>
        </div>
      </div>
    </div>
  )
}

