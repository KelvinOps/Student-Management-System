import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"

interface TimetableEntry {
  id: string
  day: string
  time: string
  subject: string
  tutor: string
  room: string
  class: string
}

interface TimetableGridProps {
  entries: TimetableEntry[]
  title?: string
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const timeSlots = [
  '08:00 - 10:00',
  '10:00 - 12:00',
  '12:00 - 14:00',
  '14:00 - 16:00',
]

export function TimetableGrid({ entries, title = "Class Timetable" }: TimetableGridProps) {
  const getEntryForSlot = (day: string, time: string) => {
    return entries.find(e => e.day === day && e.time === time)
  }

  return (
    <Card data-testid="card-timetable">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 bg-muted text-left font-semibold">Time</th>
                {days.map(day => (
                  <th key={day} className="border p-2 bg-muted text-center font-semibold">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(time => (
                <tr key={time}>
                  <td className="border p-2 font-medium text-sm bg-muted/50">
                    {time}
                  </td>
                  {days.map(day => {
                    const entry = getEntryForSlot(day, time)
                    return (
                      <td 
                        key={`${day}-${time}`} 
                        className="border p-2"
                        data-testid={`cell-${day}-${time.replace(/\s/g, '')}`}
                      >
                        {entry ? (
                          <div className="space-y-1">
                            <p className="font-semibold text-sm">{entry.subject}</p>
                            <p className="text-xs text-muted-foreground">{entry.tutor}</p>
                            <div className="flex items-center gap-1">
                              <Badge variant="secondary" className="text-xs">
                                {entry.room}
                              </Badge>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground text-sm">-</div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
