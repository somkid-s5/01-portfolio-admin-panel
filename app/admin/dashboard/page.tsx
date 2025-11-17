import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  import { Badge } from "@/components/ui/badge"
  import { Separator } from "@/components/ui/separator"
  import { FileText, FolderGit2, Award, DatabaseZap } from "lucide-react"
  
  export default function DashboardPage() {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Overview of your projects, docs, and certifications.
          </p>
        </div>
  
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="bg-card/90 border border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Projects
              </CardTitle>
              <FolderGit2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">0</div>
              <p className="text-xs text-muted-foreground">
                Total tracked projects
              </p>
            </CardContent>
          </Card>
  
          <Card className="bg-card/90 border border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Docs
              </CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">0</div>
              <p className="text-xs text-muted-foreground">
                Published knowledge articles
              </p>
            </CardContent>
          </Card>
  
          <Card className="bg-card/90 border border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Certifications
              </CardTitle>
              <Award className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">0</div>
              <p className="text-xs text-muted-foreground">
                Active / completed certs
              </p>
            </CardContent>
          </Card>
  
          <Card className="bg-card/90 border border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                DB Docs Sections
              </CardTitle>
              <DatabaseZap className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">0</div>
              <p className="text-xs text-muted-foreground">
                Structured database-related docs
              </p>
            </CardContent>
          </Card>
        </div>
  
        {/* Recent activity / placeholders */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2 bg-card/90 border border-border/60">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Recent Activity
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">
                Coming soon
              </Badge>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Activity feed will show latest changes to projects, docs,
                and certifications once data is connected.
              </p>
            </CardContent>
          </Card>
  
          <Card className="bg-card/90 border border-border/60">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Quick Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">Create</p>
                <Separator className="bg-border/60" />
                <ul className="mt-1 space-y-1">
                  <li className="flex items-center justify-between">
                    <span>New project</span>
                    <Badge variant="outline" className="text-[10px]">
                      /admin/projects
                    </Badge>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>New doc page</span>
                    <Badge variant="outline" className="text-[10px]">
                      /admin/docs
                    </Badge>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Add certification</span>
                    <Badge variant="outline" className="text-[10px]">
                      /admin/certifications
                    </Badge>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
  