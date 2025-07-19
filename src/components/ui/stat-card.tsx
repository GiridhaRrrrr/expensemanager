import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
  variant?: 'default' | 'income' | 'expense' | 'savings';
}

const variantStyles = {
  default: 'bg-gradient-card border-border',
  income: 'bg-gradient-success border-success/20',
  expense: 'bg-card border-destructive/20',
  savings: 'bg-gradient-primary border-primary/20',
};

const iconStyles = {
  default: 'text-primary bg-primary/10',
  income: 'text-success-foreground bg-success',
  expense: 'text-destructive bg-destructive/10',
  savings: 'text-primary-foreground bg-primary',
};

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  className,
  variant = 'default' 
}: StatCardProps) {
  return (
    <Card className={cn(
      'shadow-card hover:shadow-elevated transition-shadow duration-200',
      variantStyles[variant],
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn(
          'p-2 rounded-lg',
          iconStyles[variant]
        )}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground mb-1">
          {value}
        </div>
        {trend && (
          <p className={cn(
            'text-xs flex items-center gap-1',
            trend.isPositive ? 'text-success' : 'text-destructive'
          )}>
            <span className={cn(
              'inline-block w-2 h-2 rounded-full',
              trend.isPositive ? 'bg-success' : 'bg-destructive'
            )} />
            {trend.value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}