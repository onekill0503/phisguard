import React from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { Transaction } from '../types'
import { formatEther } from 'ethers'
import { CheckCircle, XCircle, ShieldCheck, ShieldAlert } from 'lucide-react'

interface TransactionListProps {
  transactions: Transaction[]
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  const getAIAnalysis = (tx: Transaction) => {
    if (tx.status) {
      return {
        status: 'SAFE',
        description: 'Regular value transfer',
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      }
    }
    return {
      status: 'NOT SAFE',
      description: 'Failed transaction - potential issues',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Task ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              From
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              To
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Value
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Result
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Age
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((tx) => {
            const aiAnalysis = getAIAnalysis(tx)
            return (
              <tr key={tx.hash} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                <Link to={`/tx/${tx.hash}`} className="text-blue-600 flex items-center hover:text-blue-800">
                  {tx.status ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 inline-block" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 mr-2 inline-block" />
                  )}
                  
                    {`${tx.hash}`}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link to={`/address/${tx.from}`} className="text-blue-600 hover:text-blue-800">
                    {`${tx.from.substring(0, 6)}...${tx.from.substring(tx.from.length - 4)}`}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link to={`/address/${tx.to}`} className="text-blue-600 hover:text-blue-800">
                    {`${tx.to.substring(0, 6)}...${tx.to.substring(tx.to.length - 4)}`}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{formatEther(tx.value)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className={`flex items-center gap-2 rounded-full`}
                  >
                    { tx.status ? <ShieldCheck className={`w-4 h-4 ${aiAnalysis.color}`} /> : <ShieldAlert className={`w-4 h-4 ${aiAnalysis.color}`} /> }
                    <span className={`text-sm font-medium ${aiAnalysis.color}`}>
                      {aiAnalysis.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {formatDistanceToNow(new Date(tx.timestamp * 1000), { addSuffix: true })}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
