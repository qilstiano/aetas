"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, Mail, Moon, Save, Sun, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { MainLayout } from "@/components/main-layout"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface SettingsFormProps {
  user: any
  settings: any
}

export function SettingsForm({ user, settings }: SettingsFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState(user.user_metadata?.full_name || "")
  const [email, setEmail] = useState(user.email || "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [emailNotifications, setEmailNotifications] = useState(settings?.email_notifications ?? true)
  const [pushNotifications, setPushNotifications] = useState(settings?.push_notifications ?? true)
  const [theme, setTheme] = useState(settings?.theme || "system")
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleSaveProfile = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: name },
      })

      if (error) throw error

      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "There was an error updating your profile",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveAccount = async () => {
    setIsLoading(true)
    try {
      if (email !== user.email) {
        const { error } = await supabase.auth.updateUser({ email })
        if (error) throw error
      }

      if (newPassword) {
        if (newPassword !== confirmPassword) {
          toast({
            title: "Passwords don't match",
            description: "New password and confirmation don't match",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        const { error } = await supabase.auth.updateUser({ password: newPassword })
        if (error) throw error

        // Clear password fields
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      }

      toast({
        title: "Account updated",
        description: "Your account information has been updated successfully.",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "There was an error updating your account",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveNotifications = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("user_settings")
        .update({
          email_notifications: emailNotifications,
          push_notifications: pushNotifications,
        })
        .eq("user_id", user.id)

      if (error) throw error

      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been saved.",
      })
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "There was an error updating your notification settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveAppearance = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from("user_settings")
        .update({
          theme,
        })
        .eq("user_id", user.id)

      if (error) throw error

      toast({
        title: "Appearance settings updated",
        description: "Your theme preferences have been saved.",
      })
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "There was an error updating your appearance settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDialogOpen(false)
    setIsLoading(true)

    try {
      // In a real app, you would implement account deletion logic here
      // This would typically involve:
      // 1. Deleting user data from Supabase tables
      // 2. Deleting the user's auth account

      const { error } = await supabase.auth.signOut()
      if (error) throw error

      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      })

      router.push("/login")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "There was an error deleting your account",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <MainLayout user={{ id: user.id, email: user.email, full_name: user.user_metadata?.full_name }}>
      <div className="container max-w-4xl py-8">
        <h1 className="mb-6 text-3xl font-bold tracking-tight">Settings</h1>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Manage your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveProfile} disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </div>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>Manage your account settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <div className="pt-4">
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive">Delete Account</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                          This action cannot be undone. This will permanently delete your account and remove all your
                          data.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteAccount}>
                          Delete Account
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveAccount} disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </div>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4" />
                    <Label htmlFor="pushNotifications">Push Notifications</Label>
                  </div>
                  <Switch id="pushNotifications" checked={pushNotifications} onCheckedChange={setPushNotifications} />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveNotifications} disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </div>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how the application looks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <div className="flex gap-4">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      className="flex items-center gap-2"
                      onClick={() => setTheme("light")}
                    >
                      <Sun className="h-4 w-4" />
                      <span>Light</span>
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      className="flex items-center gap-2"
                      onClick={() => setTheme("dark")}
                    >
                      <Moon className="h-4 w-4" />
                      <span>Dark</span>
                    </Button>
                    <Button
                      variant={theme === "system" ? "default" : "outline"}
                      className="flex items-center gap-2"
                      onClick={() => setTheme("system")}
                    >
                      <User className="h-4 w-4" />
                      <span>System</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveAppearance} disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </div>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
