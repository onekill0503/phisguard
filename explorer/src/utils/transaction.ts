import { AbiCoder } from "ethers";
import { Transaction } from "../schema/types/Transaction";
import { Transaction as TransactionDto } from "../types/index";

export const toTransactionDto = (transactions: Transaction[]): TransactionDto[] => {
    return transactions.map((transaction) => {
        return {
            hash: transaction.taskIndex,
            from: transaction.from,
            to: transaction.to,
            value: transaction.value,
            timestamp: Number(transaction.blockTimestamp),
            status: transaction.status,
            data: transaction.data,
            reason: AbiCoder.defaultAbiCoder().decode(["string"], transaction.message)[0],
        }
    });
}