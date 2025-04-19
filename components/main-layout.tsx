"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Calendar, Home, FileText, ChevronFirst, ChevronLast, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface MainLayoutProps {
  children: React.ReactNode
  user: {
    id: string
    email: string
    full_name?: string
  }
}

export function MainLayout({ children, user }: MainLayoutProps) {
  const pathname = usePathname()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Load the sidebar state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem("sidebar-collapsed")
    if (savedState !== null) {
      setIsSidebarCollapsed(savedState === "true")
    }
  }, [])

  // Save sidebar state to localStorage when it changes
  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed
    setIsSidebarCollapsed(newState)
    localStorage.setItem("sidebar-collapsed", String(newState))
  }

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      current: pathname === "/dashboard",
    },
    {
      name: "Calendar",
      href: "/calendar",
      icon: Calendar,
      current: pathname === "/calendar",
    },
    {
      name: "Notes",
      href: "/notes",
      icon: FileText,
      current: pathname === "/notes" || pathname.startsWith("/notes/"),
    },
    {
      name: "einstein",
      href: "/einstein",
      icon: () => <Image src="/einstein-icon.png" alt="" width={24} height={24} className="h-5 w-5 object-contain" />,
      current: pathname === "/einstein",
    },
  ]

  return (
    <div className="flex h-svh">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden h-svh border-r bg-background transition-all duration-300 ease-in-out md:block",
          isSidebarCollapsed ? "w-[70px]" : "w-64",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 shrink-0 items-center border-b px-4">
            <h1 className="font-ibm-plex-mono text-xl font-semibold">{isSidebarCollapsed ? "a" : "aetas"}</h1>
          </div>

          <nav className="flex flex-1 flex-col py-4">
            <ul className="flex flex-1 flex-col gap-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        item.current ? "bg-primary/10 text-primary" : "hover:bg-muted/80",
                      )}
                      title={isSidebarCollapsed ? item.name : undefined}
                    >
                      {typeof Icon === "function" ? <Icon /> : <Icon className="h-5 w-5" />}
                      {!isSidebarCollapsed && <span>{item.name}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between px-3">
                <div className={cn("flex items-center gap-3", isSidebarCollapsed && "hidden")}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <span className="text-sm font-medium uppercase">
                      {user?.full_name?.[0] || user?.email[0] || "U"}
                    </span>
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium">{user?.full_name || user?.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="h-8 w-8"
                  title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {isSidebarCollapsed ? <ChevronLast className="h-4 w-4" /> : <ChevronFirst className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </nav>
        </div>
      </aside>

      {/* Mobile Menu */}
      <div className="flex w-full flex-col md:hidden">
        <header className="flex h-16 items-center border-b px-4">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-[250px] flex-col p-0">
              <div className="flex h-16 shrink-0 items-center border-b px-4">
                <h1 className="font-ibm-plex-mono text-xl font-semibold">aetas</h1>
              </div>
              <nav className="flex flex-1 flex-col py-4">
                <ul className="flex flex-1 flex-col gap-1">
                  {navigation.map((item) => {
                    const Icon = item.icon
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                            item.current ? "bg-primary/10 text-primary" : "hover:bg-muted/80",
                          )}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {typeof Icon === "function" ? <Icon /> : <Icon className="h-5 w-5" />}
                          <span>{item.name}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
                <div className="border-t pt-4">
                  <div className="flex items-center px-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <span className="text-sm font-medium uppercase">
                        {user?.full_name?.[0] || user?.email[0] || "U"}
                      </span>
                    </div>
                    <div className="ml-3 truncate">
                      <p className="text-sm font-medium">{user?.full_name || user?.email}</p>
                    </div>
                  </div>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
          <h1 className="font-ibm-plex-mono text-xl font-semibold">aetas</h1>
        </header>
        {children}
      </div>

      {/* Main Content (Desktop) */}
      <main className="hidden w-full md:block">{children}</main>
    </div>
  )
}
