import React, { useState, useEffect } from 'react';
import { Blocks } from 'lucide-react';
import { TransactionList } from '../components/TransactionList';
import { LoadingScreen } from '../components/LoadingScreen';
import { Transaction } from '../types';
import { Transaction as RawTransaction } from '../schema/types/Transaction';
import { getLastTransaction } from '../utils/subgraph';
import { toTransactionDto } from '../utils/transaction';

export const Home: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // Simulate API call
    const fetchTransactions = async () => {
      try {
        const rawData: RawTransaction[] = await getLastTransaction();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        setTransactions(toTransactionDto(rawData));
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Blocks className="w-8 h-8 text-blue-600" />
        <h1 className="text-2xl font-bold">Latest Transactions</h1>
      </div>
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <LoadingScreen />
        ) : (
          <TransactionList transactions={transactions} />
        )}
      </div>
    </div>
  );
};