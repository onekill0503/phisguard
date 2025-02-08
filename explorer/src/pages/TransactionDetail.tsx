import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { LoadingScreen } from '../components/LoadingScreen';
import { Transaction } from '../types';
import { getTransaction } from '../utils/subgraph';
import { Transaction as RawTransaction } from '../schema/types/Transaction';
import { toTransactionDto } from '../utils/transaction';
import { formatEther } from 'ethers';

export const TransactionDetail: React.FC = () => {
  const { hash } = useParams<{ hash: string }>();
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const rawData: RawTransaction | null = await getTransaction(hash!);
        const data = rawData ? toTransactionDto([rawData])[0] : null;
        setTransaction(data || null);
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [hash]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingScreen />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          Transaction not found
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Status Banner */}
        <div className={`p-6 ${transaction.status ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {transaction.status ? (
                <>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <div>
                    <h1 className="text-2xl font-bold text-green-700">Transaction Successful</h1>
                    <p className="text-green-600 mt-1">Transaction has been successfully executed</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-8 h-8 text-red-500" />
                  <div>
                    <h1 className="text-2xl font-bold text-red-700">Transaction Failed</h1>
                    {/* <p className="text-red-600 mt-1">{transaction.reason}</p> */}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="p-8 space-y-8">
          {/* From - To Section */}
          <div className="flex items-center gap-4">
            <div className="flex-1 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">From</p>
              <Link 
                to={`/address/${transaction.from}`}
                className="text-blue-600 hover:text-blue-800 font-mono break-all"
              >
                {transaction.from}
              </Link>
            </div>
            <ArrowRight className="w-6 h-6 text-gray-400 flex-shrink-0" />
            <div className="flex-1 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">To</p>
              <Link 
                to={`/address/${transaction.to}`}
                className="text-blue-600 hover:text-blue-800 font-mono break-all"
              >
                {transaction.to}
              </Link>
            </div>
          </div>

          {/* Value */}
          <div className="p-6 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-2">Value</p>
            <p className="text-2xl font-semibold">{formatEther(transaction.value)}</p>
          </div>

          {/* Data */}
          {transaction.data && (
            <div className="p-6 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">Data</p>
              <p className="font-mono text-sm break-all bg-gray-100 p-4 rounded-md">
                {transaction.data}
              </p>
            </div>
          )}

          {/* Reason */}
          {transaction.reason && (
            <div className="p-6 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">Reason</p>
              <p className="text-lg">{transaction.reason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};