export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: boolean;
  data?: string;
  reason?: string;
}
export interface Address {
  address: string;
  balance: string;
  transactions: Transaction[];
}