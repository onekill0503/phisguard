import { Transaction, Address } from '../types';

export const mockTransactions: Transaction[] = [
  {
    hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    from: '0xD8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    value: '1.5 ETH',
    timestamp: Date.now() - 1000000,
    status: 'success',
    data: '0x095ea7b3000000000000000000000000def1c0ded9bec7f1a1670819833240f027b25eff000000000000000000000000000000000000000000000000000000000000000f',
    reason: 'Token Approval'
  },
  {
    hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    from: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    to: '0xD8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    value: '0.5 ETH',
    timestamp: Date.now() - 2000000,
    status: 'failed',
    data: '0x',
    reason: 'Out of gas'
  }
];

export const mockAddresses: Address[] = [
  {
    address: '0xD8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    balance: '100.5 ETH',
    transactions: mockTransactions
  },
  {
    address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    balance: '50.2 ETH',
    transactions: mockTransactions
  }
];