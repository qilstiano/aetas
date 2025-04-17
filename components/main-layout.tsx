"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BookText, Calendar, ChevronLeft, ChevronRight, Home, LogOut, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { createClient } from "@/lib/supabase/client"
import { MetallicGradient } from "@/components/metallic-gradient"
import { useToast } from "@/components/ui/use-toast"

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
  const router = useRouter()
  const { toast } = useToast()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const supabase = createClient()

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/login")
      router.refresh()
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Notes", href: "/notes", icon: BookText },
  ]

  const isActive = (path: string) => {
    if (path === pathname) return true
    if (path !== "/dashboard" && pathname.startsWith(path)) return true
    return false
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MetallicGradient />

      {/* Mobile header */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] sm:w-[300px]">
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b py-4">
                    <h2 className="app-title text-lg font-semibold metallic-text">inaros</h2>
                    <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <nav className="flex-1 overflow-auto py-4">
                    <ul className="space-y-2 px-2">
                      {navigation.map((item) => (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                              isActive(item.href) ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                            }`}
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <item.icon className="mr-2 h-4 w-4" />
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                  <div className="border-t p-4">
                    <Button variant="outline" className="w-full justify-start" onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Link href="/dashboard" className="ml-2 app-title text-lg font-bold metallic-text">
              inaros
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{user.full_name || user.email}</span>
          </div>
        </div>
      </header>

      {/* Desktop layout */}
      <div className="hidden md:flex md:flex-1">
        <aside
          className={`fixed inset-y-0 left-0 ${
            sidebarCollapsed ? "w-16" : "w-64"
          } border-r bg-background/80 backdrop-blur-sm transition-all duration-300`}
        >
          <div className="flex h-full flex-col">
            <div className="flex h-14 items-center border-b px-4 justify-between">
              <Link
                href="/dashboard"
                className={`app-title text-xl font-bold metallic-text ${sidebarCollapsed ? "hidden" : ""}`}
              >
                inaros
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="flex-shrink-0"
              >
                {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>
            <nav className="flex-1 overflow-auto p-4">
              <ul className="space-y-2">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        isActive(item.href) ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                      }`}
                      title={sidebarCollapsed ? item.name : ""}
                    >
                      <item.icon className={`${sidebarCollapsed ? "mx-auto" : "mr-2"} h-4 w-4`} />
                      {!sidebarCollapsed && <span>{item.name}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className={`border-t p-4 ${sidebarCollapsed ? "flex justify-center" : ""}`}>
              {!sidebarCollapsed && (
                <div className="mb-4 flex items-center">
                  <div className="ml-2">
                    <p className="text-sm font-medium">{user.full_name || "User"}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              )}
              <Button
                variant="outline"
                className={`${sidebarCollapsed ? "p-2" : "w-full justify-start"}`}
                onClick={handleSignOut}
                title={sidebarCollapsed ? "Sign out" : ""}
              >
                <LogOut className={`${sidebarCollapsed ? "h-4 w-4" : "mr-2 h-4 w-4"}`} />
                {!sidebarCollapsed && <span>Sign out</span>}
              </Button>
            </div>
          </div>
        </aside>
        <main className={`${sidebarCollapsed ? "ml-16" : "ml-64"} flex-1 transition-all duration-300`}>{children}</main>
      </div>

      {/* Mobile content */}
      <main className="flex-1 md:hidden">{children}</main>
    </div>
  )
}
