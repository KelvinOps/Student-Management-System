import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table"
import { Save } from "lucide-react"

interface StudentMark {
  id: string
  studentId: string
  studentName: string
  admissionNumber: string
  catMarks: string
  examMarks: string
  totalMarks: number
  grade: string
}

interface MarksEntryFormProps {
  students: Omit<StudentMark, 'totalMarks' | 'grade'>[]
  subjectName: string
  maxCAT?: number
  maxExam?: number
}

export function MarksEntryForm({ students, subjectName, maxCAT = 30, maxExam = 70 }: MarksEntryFormProps) {
  const [marks, setMarks] = useState<StudentMark[]>(
    students.map(s => ({
      ...s,
      totalMarks: 0,
      grade: '-',
    }))
  )

  const calculateGrade = (total: number): string => {
    if (total >= 70) return 'A'
    if (total >= 60) return 'B'
    if (total >= 50) return 'C'
    if (total >= 40) return 'D'
    return 'F'
  }

  const handleMarkChange = (id: string, field: 'catMarks' | 'examMarks', value: string) => {
    setMarks(prev => prev.map(m => {
      if (m.id !== id) return m
      
      const updated = { ...m, [field]: value }
      const cat = parseFloat(updated.catMarks) || 0
      const exam = parseFloat(updated.examMarks) || 0
      const total = cat + exam
      
      return {
        ...updated,
        totalMarks: total,
        grade: total > 0 ? calculateGrade(total) : '-',
      }
    }))
    console.log(`Updated ${field} for student ${id}: ${value}`)
  }

  const handleSave = () => {
    console.log('Saving marks:', marks)
  }

  return (
    <Card data-testid="form-marks-entry">
      <CardHeader>
        <CardTitle>{subjectName} - Marks Entry</CardTitle>
        <p className="text-sm text-muted-foreground">
          CAT: /{maxCAT} marks | Exam: /{maxExam} marks
        </p>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Admission No.</TableHead>
                <TableHead className="text-center">CAT (/{maxCAT})</TableHead>
                <TableHead className="text-center">Exam (/{maxExam})</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {marks.map((mark) => (
                <TableRow key={mark.id} data-testid={`row-student-${mark.studentId}`}>
                  <TableCell className="font-medium">{mark.studentName}</TableCell>
                  <TableCell className="font-mono text-sm">{mark.admissionNumber}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      max={maxCAT}
                      value={mark.catMarks}
                      onChange={(e) => handleMarkChange(mark.id, 'catMarks', e.target.value)}
                      className="w-20 text-center"
                      data-testid={`input-cat-${mark.studentId}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      max={maxExam}
                      value={mark.examMarks}
                      onChange={(e) => handleMarkChange(mark.id, 'examMarks', e.target.value)}
                      className="w-20 text-center"
                      data-testid={`input-exam-${mark.studentId}`}
                    />
                  </TableCell>
                  <TableCell className="text-center font-bold" data-testid={`text-total-${mark.studentId}`}>
                    {mark.totalMarks}
                  </TableCell>
                  <TableCell className="text-center font-bold" data-testid={`text-grade-${mark.studentId}`}>
                    {mark.grade}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSave} data-testid="button-save-marks">
            <Save className="h-4 w-4 mr-2" />
            Save Marks
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}