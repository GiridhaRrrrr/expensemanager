import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Target, Plus, Edit, Trash2, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { useFinance, Budget } from '@/contexts/FinanceContext';
import { useToast } from '@/hooks/use-toast';

const budgetSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: z.string().min(1, 'Amount is required').refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, 'Amount must be a positive number'),
  month: z.string().min(1, 'Month is required'),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

export default function BudgetPage() {
  const { state, addBudget, updateBudget, deleteBudget } = useFinance();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const currentDate = new Date();
  const currentMonth = format(currentDate, 'yyyy-MM');

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category: '',
      amount: '',
      month: currentMonth,
    },
  });

  // Get current month transactions
  const currentMonthStart = startOfMonth(currentDate);
  const currentMonthEnd = endOfMonth(currentDate);
  
  const currentMonthTransactions = state.transactions.filter(t => {
    const transactionDate = parseISO(t.date);
    return transactionDate >= currentMonthStart && transactionDate <= currentMonthEnd;
  });

  // Calculate budget vs actual for current month
  const budgetAnalysis = state.budgets
    .filter(b => b.month === currentMonth)
    .map(budget => {
      const spent = currentMonthTransactions
        .filter(t => t.type === 'expense' && t.category === budget.category)
        .reduce((sum, t) => sum + t.amount, 0);

      const percentage = (spent / budget.amount) * 100;
      const remaining = budget.amount - spent;

      return {
        ...budget,
        spent,
        remaining,
        percentage,
        status: percentage > 100 ? 'over' : percentage > 80 ? 'warning' : 'good'
      };
    })
    .sort((a, b) => b.percentage - a.percentage);

  // Get available categories (not yet budgeted for current month)
  const budgetedCategories = budgetAnalysis.map(b => b.category);
  const availableCategories = state.categories
    .filter(cat => !budgetedCategories.includes(cat.name))
    .filter(cat => !['Salary', 'Freelance', 'Investment'].includes(cat.name)); // Exclude income categories

  const handleSubmit = (data: BudgetFormData) => {
    const budgetData = {
      category: data.category,
      amount: parseFloat(data.amount),
      month: data.month,
    };

    if (editingBudget) {
      updateBudget({ ...budgetData, id: editingBudget.id });
      toast({
        title: 'Budget updated',
        description: 'Your budget has been updated successfully.',
      });
    } else {
      addBudget(budgetData);
      toast({
        title: 'Budget created',
        description: 'Your budget has been created successfully.',
      });
    }

    form.reset();
    setIsDialogOpen(false);
    setEditingBudget(null);
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    form.reset({
      category: budget.category,
      amount: budget.amount.toString(),
      month: budget.month,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteBudget(id);
    toast({
      title: 'Budget deleted',
      description: 'The budget has been removed successfully.',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'over': return 'text-destructive';
      case 'warning': return 'text-warning';
      default: return 'text-success';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'over': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      default: return <CheckCircle className="h-4 w-4 text-success" />;
    }
  };

  const totalBudget = budgetAnalysis.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgetAnalysis.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="text-center lg:text-left">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">Budget</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Manage your monthly budgets for {format(currentDate, 'MMMM yyyy')}
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 h-11 min-w-[140px]">
              <Plus className="h-4 w-4" />
              Create Budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingBudget ? 'Edit Budget' : 'Create New Budget'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={!!editingBudget}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {editingBudget ? (
                            <SelectItem value={editingBudget.category}>
                              {editingBudget.category}
                            </SelectItem>
                          ) : (
                            availableCategories.map((category) => (
                              <SelectItem key={category.id} value={category.name}>
                                {category.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input 
                            placeholder="0.00" 
                            type="number" 
                            step="0.01" 
                            min="0"
                            className="pl-8"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Month</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select month" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={currentMonth}>
                            {format(currentDate, 'MMMM yyyy')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingBudget ? 'Update Budget' : 'Create Budget'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingBudget(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <Card className="shadow-card bg-gradient-primary border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary-foreground/80">Total Budget</p>
                <p className="text-2xl font-bold text-primary-foreground">
                  {formatCurrency(totalBudget)}
                </p>
              </div>
              <div className="p-2 bg-primary-foreground/10 rounded-lg">
                <Target className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-destructive/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency(totalSpent)}
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
                <p className="text-sm font-medium text-success-foreground/80">Remaining</p>
                <p className="text-2xl font-bold text-success-foreground">
                  {formatCurrency(totalRemaining)}
                </p>
              </div>
              <div className="p-2 bg-success-foreground/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-success-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      {totalBudget > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Overall Budget Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Progress</span>
                <span className={overallPercentage > 100 ? 'text-destructive' : 'text-foreground'}>
                  {overallPercentage.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.min(overallPercentage, 100)} 
                className="h-3"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(totalSpent)} spent</span>
                <span>{formatCurrency(totalBudget)} budgeted</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Categories */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Budget Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {budgetAnalysis.length > 0 ? (
            <div className="space-y-6">
              {budgetAnalysis.map((budget) => (
                <div key={budget.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(budget.status)}
                      <div>
                        <h3 className="font-medium">{budget.category}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(budget.spent)} of {formatCurrency(budget.amount)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`font-bold ${getStatusColor(budget.status)}`}>
                          {budget.percentage.toFixed(1)}%
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {budget.remaining >= 0 
                            ? `${formatCurrency(budget.remaining)} left`
                            : `${formatCurrency(Math.abs(budget.remaining))} over`
                          }
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(budget)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Budget</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the budget for {budget.category}? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(budget.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                  
                  <Progress 
                    value={Math.min(budget.percentage, 100)} 
                    className="h-2"
                  />
                  
                  {budget.status === 'over' && (
                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded-lg">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Budget exceeded! Consider reviewing your spending in this category.</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No budgets set</h3>
              <p className="text-muted-foreground mb-4">
                Create your first budget to start tracking your spending goals.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}