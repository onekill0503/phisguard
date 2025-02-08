import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { TransactionList } from '../components/TransactionList';
import { LoadingScreen } from '../components/LoadingScreen';
import { Address } from '../types';
import { Transaction as RawTransaction } from '../schema/types/Transaction';
import { getLastTransactionByAddress } from '../utils/subgraph';
import { toTransactionDto } from '../utils/transaction';
import { getWalletBalance } from '../utils/ethers';

export const AddressDetail: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const [loading, setLoading] = useState(true);
  const [addressData, setAddressData] = useState<Address | null>(null);

  useEffect(() => {
    const fetchAddressData = async () => {
      try {
        const rawData: RawTransaction[] = await getLastTransactionByAddress(address!);
        setAddressData({
          address: address!,
          balance: await getWalletBalance(address!),
          transactions: toTransactionDto(rawData)
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAddressData();
  }, [address]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingScreen />
      </div>
    );
  }

  if (!addressData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          Address not found
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-semibold">Address</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Address:</p>
            <p className="font-mono">{addressData.address}</p>
          </div>
          <div>
            <p className="text-gray-600">Balance:</p>
            <p className="font-semibold">{addressData.balance}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Transactions</h2>
        </div>
        <TransactionList transactions={addressData.transactions} />
      </div>
    </div>
  );
};