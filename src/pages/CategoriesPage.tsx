import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { PieChart as PieChartIcon, TrendingUp, Target } from 'lucide-react';
import { useFinance } from '@/contexts/FinanceContext';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';

export default function CategoriesPage() {
  const { state } = useFinance();
  
  const currentDate = new Date();
  const currentMonthStart = startOfMonth(currentDate);
  const currentMonthEnd = endOfMonth(currentDate);
  
  const currentMonthTransactions = state.transactions.filter(t => {
    const transactionDate = parseISO(t.date);
    return transactionDate >= currentMonthStart && transactionDate <= currentMonthEnd;
  });

  // Category analysis
  const categoryAnalysis = useMemo(() => {
    const categoryTotals = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, transaction) => {
        if (!acc[transaction.category]) {
          acc[transaction.category] = {
            name: transaction.category,
            amount: 0,
            count: 0,
            transactions: []
          };
        }
        acc[transaction.category].amount += transaction.amount;
        acc[transaction.category].count += 1;
        acc[transaction.category].transactions.push(transaction);
        return acc;
      }, {} as Record<string, {
        name: string;
        amount: number;
        count: number;
        transactions: any[];
      }>);

    const totalExpenses = Object.values(categoryTotals).reduce((sum, cat) => sum + cat.amount, 0);

    return Object.values(categoryTotals)
      .map(category => ({
        ...category,
        percentage: totalExpenses > 0 ? (category.amount / totalExpenses) * 100 : 0,
        average: category.amount / category.count
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [currentMonthTransactions]);

  // Income categories
  const incomeAnalysis = useMemo(() => {
    const incomeTotals = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, transaction) => {
        if (!acc[transaction.category]) {
          acc[transaction.category] = {
            name: transaction.category,
            amount: 0,
            count: 0
          };
        }
        acc[transaction.category].amount += transaction.amount;
        acc[transaction.category].count += 1;
        return acc;
      }, {} as Record<string, {
        name: string;
        amount: number;
        count: number;
      }>);

    return Object.values(incomeTotals).sort((a, b) => b.amount - a.amount);
  }, [currentMonthTransactions]);

  // Colors for charts
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const totalExpenses = categoryAnalysis.reduce((sum, cat) => sum + cat.amount, 0);
  const totalIncome = incomeAnalysis.reduce((sum, cat) => sum + cat.amount, 0);

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="text-center lg:text-left">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">Categories</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          Analysis of your spending and income by category for {format(currentDate, 'MMMM yyyy')}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categories Used</p>
                <p className="text-2xl font-bold text-foreground">
                  {categoryAnalysis.length + incomeAnalysis.length}
                </p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <PieChartIcon className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-destructive/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
              <div className="p-2 bg-destructive/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card bg-gradient-success border-success/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-success-foreground/80">Total Income</p>
                <p className="text-2xl font-bold text-success-foreground">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
              <div className="p-2 bg-success-foreground/10 rounded-lg">
                <Target className="h-5 w-5 text-success-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        {/* Expense Categories Pie Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryAnalysis.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={categoryAnalysis}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="amount"
                    label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                  >
                    {categoryAnalysis.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Amount']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                No expense data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Comparison Bar Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Category Spending Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryAnalysis.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={categoryAnalysis.slice(0, 6)} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" tickFormatter={(value) => `$${value}`} />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Amount']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                No expense data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Category Lists */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        {/* Expense Categories Detail */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Expense Categories Detail</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryAnalysis.length > 0 ? (
              <div className="space-y-4">
                {categoryAnalysis.map((category, index) => (
                  <div key={category.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: colors[index % colors.length] }}
                        />
                        <span className="font-medium">{category.name}</span>
                        <Badge variant="outline">{category.count} transactions</Badge>
                      </div>
                      <span className="font-bold">{formatCurrency(category.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{category.percentage.toFixed(1)}% of total expenses</span>
                      <span>Avg: {formatCurrency(category.average)}</span>
                    </div>
                    <Progress value={category.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <PieChartIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No expense categories yet</p>
                <p className="text-sm">Start adding expenses to see category breakdown</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Income Categories Detail */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Income Categories Detail</CardTitle>
          </CardHeader>
          <CardContent>
            {incomeAnalysis.length > 0 ? (
              <div className="space-y-4">
                {incomeAnalysis.map((category, index) => {
                  const percentage = totalIncome > 0 ? (category.amount / totalIncome) * 100 : 0;
                  const average = category.amount / category.count;
                  
                  return (
                    <div key={category.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full bg-success"
                          />
                          <span className="font-medium">{category.name}</span>
                          <Badge variant="outline" className="border-success text-success">
                            {category.count} transactions
                          </Badge>
                        </div>
                        <span className="font-bold text-success">{formatCurrency(category.amount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{percentage.toFixed(1)}% of total income</span>
                        <span>Avg: {formatCurrency(average)}</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No income categories yet</p>
                <p className="text-sm">Start adding income to see category breakdown</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}