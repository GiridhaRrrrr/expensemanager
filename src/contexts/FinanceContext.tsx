import React, { createContext, useContext, useReducer, useEffect } from 'react';

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  category: string;
  type: 'income' | 'expense';
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  month: string; // YYYY-MM format
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface FinanceState {
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
}

type FinanceAction =
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'ADD_BUDGET'; payload: Budget }
  | { type: 'UPDATE_BUDGET'; payload: Budget }
  | { type: 'DELETE_BUDGET'; payload: string }
  | { type: 'LOAD_DATA'; payload: FinanceState };

// Default categories with financial icons
const defaultCategories: Category[] = [
  { id: '1', name: 'Food & Dining', icon: 'UtensilsCrossed', color: 'hsl(24 100% 64%)' },
  { id: '2', name: 'Transportation', icon: 'Car', color: 'hsl(214 84% 56%)' },
  { id: '3', name: 'Housing', icon: 'Home', color: 'hsl(142 76% 36%)' },
  { id: '4', name: 'Utilities', icon: 'Zap', color: 'hsl(38 92% 50%)' },
  { id: '5', name: 'Healthcare', icon: 'Heart', color: 'hsl(348 83% 47%)' },
  { id: '6', name: 'Entertainment', icon: 'Music', color: 'hsl(262 83% 58%)' },
  { id: '7', name: 'Shopping', icon: 'ShoppingBag', color: 'hsl(24 100% 64%)' },
  { id: '8', name: 'Education', icon: 'GraduationCap', color: 'hsl(214 84% 56%)' },
  { id: '9', name: 'Travel', icon: 'Plane', color: 'hsl(142 76% 36%)' },
  { id: '10', name: 'Salary', icon: 'Briefcase', color: 'hsl(142 76% 36%)' },
  { id: '11', name: 'Freelance', icon: 'Laptop', color: 'hsl(214 84% 56%)' },
  { id: '12', name: 'Investment', icon: 'TrendingUp', color: 'hsl(262 83% 58%)' },
  { id: '13', name: 'Other', icon: 'MoreHorizontal', color: 'hsl(215 16% 47%)' }
];

const initialState: FinanceState = {
  transactions: [],
  budgets: [],
  categories: defaultCategories,
};

function financeReducer(state: FinanceState, action: FinanceAction): FinanceState {
  switch (action.type) {
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [...state.transactions, action.payload],
      };
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(t =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload),
      };
    case 'ADD_BUDGET':
      return {
        ...state,
        budgets: [...state.budgets, action.payload],
      };
    case 'UPDATE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.map(b =>
          b.id === action.payload.id ? action.payload : b
        ),
      };
    case 'DELETE_BUDGET':
      return {
        ...state,
        budgets: state.budgets.filter(b => b.id !== action.payload),
      };
    case 'LOAD_DATA':
      return action.payload;
    default:
      return state;
  }
}

interface FinanceContextType {
  state: FinanceState;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addBudget: (budget: Omit<Budget, 'id'>) => void;
  updateBudget: (budget: Budget) => void;
  deleteBudget: (id: string) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(financeReducer, initialState);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('finance-data');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        dispatch({ type: 'LOAD_DATA', payload: { ...parsedData, categories: defaultCategories } });
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('finance-data', JSON.stringify({
      transactions: state.transactions,
      budgets: state.budgets,
    }));
  }, [state.transactions, state.budgets]);

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
    };
    dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction });
  };

  const updateTransaction = (transaction: Transaction) => {
    dispatch({ type: 'UPDATE_TRANSACTION', payload: transaction });
  };

  const deleteTransaction = (id: string) => {
    dispatch({ type: 'DELETE_TRANSACTION', payload: id });
  };

  const addBudget = (budget: Omit<Budget, 'id'>) => {
    const newBudget: Budget = {
      ...budget,
      id: Date.now().toString(),
    };
    dispatch({ type: 'ADD_BUDGET', payload: newBudget });
  };

  const updateBudget = (budget: Budget) => {
    dispatch({ type: 'UPDATE_BUDGET', payload: budget });
  };

  const deleteBudget = (id: string) => {
    dispatch({ type: 'DELETE_BUDGET', payload: id });
  };

  return (
    <FinanceContext.Provider
      value={{
        state,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addBudget,
        updateBudget,
        deleteBudget,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}