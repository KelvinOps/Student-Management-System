import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Download, Eye } from "lucide-react"

interface FeePayment {
  id: string
  studentName: string
  admissionNumber: string
  amount: number
  balance: number
  term: string
  paymentDate: string
  status: 'Paid' | 'Partial' | 'Pending'
}

interface FeePaymentCardProps {
  payment: FeePayment
}

const statusColors = {
  Paid: 'bg-chart-1 text-white',
  Partial: 'bg-chart-4 text-white',
  Pending: 'bg-destructive text-destructive-foreground',
}

export function FeePaymentCard({ payment }: FeePaymentCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card className="hover-elevate" data-testid={`card-payment-${payment.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base truncate" data-testid={`text-student-${payment.id}`}>
              {payment.studentName}
            </CardTitle>
            <p className="text-sm text-muted-foreground font-mono">{payment.admissionNumber}</p>
          </div>
          <Badge className={statusColors[payment.status]} data-testid={`badge-status-${payment.id}`}>
            {payment.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Amount Paid</p>
            <p className="text-lg font-bold text-chart-1" data-testid={`text-amount-${payment.id}`}>
              {formatCurrency(payment.amount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className="text-lg font-bold text-destructive" data-testid={`text-balance-${payment.id}`}>
              {formatCurrency(payment.balance)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{payment.term}</span>
          <span className="text-muted-foreground">{payment.paymentDate}</span>
        </div>
        
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1" data-testid={`button-view-receipt-${payment.id}`}>
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button size="sm" variant="outline" className="flex-1" data-testid={`button-download-receipt-${payment.id}`}>
            <Download className="h-3 w-3 mr-1" />
            Receipt
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}