import { TransactionForm } from '@/components/TransactionForm';
import { TransactionList } from '@/components/TransactionList';

export default function TransactionsPage() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="text-center lg:text-left">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">Transactions</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          Manage your income and expenses
        </p>
      </div>

      <TransactionForm />
      <TransactionList />
    </div>
  );
}