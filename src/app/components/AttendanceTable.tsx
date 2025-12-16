import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Check, X, Clock } from "lucide-react"
import { useState } from "react"

interface AttendanceRecord {
  id: string
  studentId: string
  studentName: string
  admissionNumber: string
  status: 'Present' | 'Absent' | 'Late'
}

interface AttendanceTableProps {
  records: AttendanceRecord[]
  onStatusChange?: (id: string, status: AttendanceRecord['status']) => void
}

const statusConfig = {
  Present: { icon: Check, color: 'bg-chart-1 text-white', label: 'Present' },
  Absent: { icon: X, color: 'bg-destructive text-destructive-foreground', label: 'Absent' },
  Late: { icon: Clock, color: 'bg-chart-4 text-white', label: 'Late' },
}

export function AttendanceTable({ records, onStatusChange }: AttendanceTableProps) {
  const [localRecords, setLocalRecords] = useState(records)

  const handleStatusChange = (id: string, newStatus: AttendanceRecord['status']) => {
    setLocalRecords(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r))
    onStatusChange?.(id, newStatus)
    console.log(`Attendance status changed for ${id}: ${newStatus}`)
  }

  return (
    <div className="rounded-md border" data-testid="table-attendance">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student Name</TableHead>
            <TableHead>Admission No.</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {localRecords.map((record) => {
            const StatusIcon = statusConfig[record.status].icon
            return (
              <TableRow key={record.id} data-testid={`row-student-${record.studentId}`}>
                <TableCell className="font-medium" data-testid={`text-student-name-${record.studentId}`}>
                  {record.studentName}
                </TableCell>
                <TableCell className="font-mono text-sm" data-testid={`text-admission-${record.studentId}`}>
                  {record.admissionNumber}
                </TableCell>
                <TableCell>
                  <Badge className={statusConfig[record.status].color} data-testid={`badge-status-${record.studentId}`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {record.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="sm"
                      variant={record.status === 'Present' ? 'default' : 'outline'}
                      onClick={() => handleStatusChange(record.id, 'Present')}
                      data-testid={`button-mark-present-${record.studentId}`}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant={record.status === 'Late' ? 'default' : 'outline'}
                      onClick={() => handleStatusChange(record.id, 'Late')}
                      data-testid={`button-mark-late-${record.studentId}`}
                    >
                      <Clock className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant={record.status === 'Absent' ? 'default' : 'outline'}
                      onClick={() => handleStatusChange(record.id, 'Absent')}
                      data-testid={`button-mark-absent-${record.studentId}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
