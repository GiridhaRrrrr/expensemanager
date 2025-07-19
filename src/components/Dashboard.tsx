import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  Calendar,
  AlertTriangle,
  Target
} from 'lucide-react';
import { useFinance } from '@/contexts/FinanceContext';
import { format, parseISO, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval } from 'date-fns';

export function Dashboard() {
  const { state } = useFinance();

  // Calculate current month data
  const currentDate = new Date();
  const currentMonthStart = startOfMonth(currentDate);
  const currentMonthEnd = endOfMonth(currentDate);
  
  const currentMonthTransactions = state.transactions.filter(t => {
    const transactionDate = parseISO(t.date);
    return transactionDate >= currentMonthStart && transactionDate <= currentMonthEnd;
  });

  // Calculate previous month for comparison
  const previousMonthStart = startOfMonth(subMonths(currentDate, 1));
  const previousMonthEnd = endOfMonth(subMonths(currentDate, 1));
  
  const previousMonthTransactions = state.transactions.filter(t => {
    const transactionDate = parseISO(t.date);
    return transactionDate >= previousMonthStart && transactionDate <= previousMonthEnd;
  });

  // Calculate totals
  const currentMonthIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const currentMonthExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const previousMonthIncome = previousMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const previousMonthExpenses = previousMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netIncome = currentMonthIncome - currentMonthExpenses;
  const previousNetIncome = previousMonthIncome - previousMonthExpenses;

  // Calculate trends
  const incomeTrend = previousMonthIncome > 0 
    ? ((currentMonthIncome - previousMonthIncome) / previousMonthIncome * 100).toFixed(1)
    : '0';
    
  const expenseTrend = previousMonthExpenses > 0 
    ? ((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses * 100).toFixed(1)
    : '0';

  // Monthly spending chart data
  const monthlyData = useMemo(() => {
    const last6Months = eachMonthOfInterval({
      start: subMonths(currentDate, 5),
      end: currentDate
    });

    return last6Months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthTransactions = state.transactions.filter(t => {
        const transactionDate = parseISO(t.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
        
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        month: format(month, 'MMM'),
        income,
        expenses,
        net: income - expenses
      };
    });
  }, [state.transactions, currentDate]);

  // Category spending data for pie chart
  const categoryData = useMemo(() => {
    const categoryTotals = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, transaction) => {
        acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        name: category,
        value: amount,
        percentage: ((amount / currentMonthExpenses) * 100).toFixed(1)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Top 6 categories
  }, [currentMonthTransactions, currentMonthExpenses]);

  // Colors for pie chart
  const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  // Recent transactions
  const recentTransactions = state.transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Budget alerts
  const currentMonthBudgets = state.budgets.filter(b => 
    b.month === format(currentDate, 'yyyy-MM')
  );

  const budgetAlerts = currentMonthBudgets.map(budget => {
    const spent = currentMonthTransactions
      .filter(t => t.type === 'expense' && t.category === budget.category)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const percentage = (spent / budget.amount) * 100;
    
    return {
      category: budget.category,
      spent,
      budget: budget.amount,
      percentage,
      isOverBudget: percentage > 100,
      isNearLimit: percentage > 80 && percentage <= 100
    };
  }).filter(alert => alert.isOverBudget || alert.isNearLimit);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="text-center lg:text-left">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          Overview of your financial activity for {format(currentDate, 'MMMM yyyy')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Total Income"
          value={formatCurrency(currentMonthIncome)}
          icon={TrendingUp}
          variant="income"
          trend={{
            value: `${incomeTrend}% from last month`,
            isPositive: parseFloat(incomeTrend) >= 0
          }}
        />
        
        <StatCard
          title="Total Expenses"
          value={formatCurrency(currentMonthExpenses)}
          icon={TrendingDown}
          variant="expense"
          trend={{
            value: `${expenseTrend}% from last month`,
            isPositive: parseFloat(expenseTrend) <= 0
          }}
        />
        
        <StatCard
          title="Net Income"
          value={formatCurrency(netIncome)}
          icon={DollarSign}
          variant={netIncome >= 0 ? 'savings' : 'expense'}
        />
        
        <StatCard
          title="Transactions"
          value={currentMonthTransactions.length.toString()}
          icon={Wallet}
        />
      </div>

      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <Card className="shadow-card border-warning/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Budget Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {budgetAlerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-warning/20 bg-warning-muted">
                  <div>
                    <p className="font-medium">{alert.category}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(alert.spent)} of {formatCurrency(alert.budget)} spent
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${alert.isOverBudget ? 'text-destructive' : 'text-warning'}`}>
                      {alert.percentage.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {alert.isOverBudget ? 'Over budget' : 'Near limit'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        {/* Monthly Trend */}
        <Card className="shadow-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg lg:text-xl">6-Month Trend</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), '']}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="income" fill="hsl(var(--success))" name="Income" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="Expenses" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="shadow-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg lg:text-xl">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
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
                <div className="text-center">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No expenses this month</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="shadow-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg lg:text-xl">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 lg:p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm lg:text-base truncate">{transaction.description}</p>
                    <p className="text-xs lg:text-sm text-muted-foreground">
                      {transaction.category} • {format(parseISO(transaction.date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className={`font-bold text-sm lg:text-base ${transaction.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-sm">Start by adding your first transaction</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}