import { Card, CardContent } from "../components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { MoreVertical, Mail, Phone } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"

interface StudentCardProps {
  student: {
    id: string
    name: string
    admissionNumber: string
    class: string
    department: string
    status: 'Active' | 'Inactive' | 'Graduated' | 'Suspended'
    avatar?: string
    email?: string
    phone?: string
  }
}

const statusColors = {
  Active: 'bg-chart-1 text-white',
  Inactive: 'bg-muted text-muted-foreground',
  Graduated: 'bg-chart-2 text-white',
  Suspended: 'bg-destructive text-destructive-foreground',
}

export function StudentCard({ student }: StudentCardProps) {
  const initials = student.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()

  return (
    <Card className="hover-elevate" data-testid={`card-student-${student.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={student.avatar} alt={student.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold truncate" data-testid={`text-student-name-${student.id}`}>{student.name}</h3>
                <p className="text-sm text-muted-foreground font-mono" data-testid={`text-student-admission-${student.id}`}>{student.admissionNumber}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid={`button-student-menu-${student.id}`}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem data-testid="button-view-profile">View Profile</DropdownMenuItem>
                  <DropdownMenuItem data-testid="button-edit-student">Edit</DropdownMenuItem>
                  <DropdownMenuItem data-testid="button-view-attendance">View Attendance</DropdownMenuItem>
                  <DropdownMenuItem data-testid="button-view-marks">View Marks</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="mt-2 space-y-1">
              <p className="text-sm">
                <span className="text-muted-foreground">Class:</span> {student.class}
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Department:</span> {student.department}
              </p>
            </div>
            
            <div className="mt-3 flex items-center gap-2">
              <Badge className={statusColors[student.status]} data-testid={`badge-status-${student.id}`}>
                {student.status}
              </Badge>
              {student.email && (
                <Button variant="ghost" size="icon" className="h-7 w-7" data-testid="button-email-student">
                  <Mail className="h-3 w-3" />
                </Button>
              )}
              {student.phone && (
                <Button variant="ghost" size="icon" className="h-7 w-7" data-testid="button-call-student">
                  <Phone className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
