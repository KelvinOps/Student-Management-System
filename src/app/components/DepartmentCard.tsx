import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Building2, Users, GraduationCap, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"

interface Department {
  id: string
  name: string
  code: string
  studentCount: number
  programmeCount: number
  isActive: boolean
}

interface DepartmentCardProps {
  department: Department
}

export function DepartmentCard({ department }: DepartmentCardProps) {
  return (
    <Card className="hover-elevate" data-testid={`card-department-${department.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base truncate" data-testid={`text-dept-name-${department.id}`}>
                {department.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground font-mono">{department.code}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={department.isActive ? "default" : "secondary"} data-testid={`badge-status-${department.id}`}>
              {department.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid={`button-menu-${department.id}`}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem data-testid="button-view-dept">View Details</DropdownMenuItem>
                <DropdownMenuItem data-testid="button-edit-dept">Edit</DropdownMenuItem>
                <DropdownMenuItem data-testid="button-manage-programmes">Manage Programmes</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Students</p>
              <p className="text-lg font-bold" data-testid={`text-student-count-${department.id}`}>
                {department.studentCount}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Programmes</p>
              <p className="text-lg font-bold" data-testid={`text-programme-count-${department.id}`}>
                {department.programmeCount}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
