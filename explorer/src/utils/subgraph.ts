
import { GraphQLClient } from "graphql-request";
import { Transaction } from "../schema/types/Transaction";
import GET_LAST_TRANSACTION from "../schema/queries/GetLastTransaction";
import GET_TRANSACTION from "../schema/queries/GetTransaction";
import GET_LAST_TRANSACTION_BY_ADDRESS from "../schema/queries/GetLastTransactionByAddress";
 

export const getLastTransaction = async () => {
  const client = getSubGraphClient();
  try {
    const response = (
      await client.request<{ transactions: { items: Transaction[]} }>(GET_LAST_TRANSACTION)
    ).transactions.items;
    return response;
  } catch (error) {
    console.error("Error fetching deposits:", error);
    return [];
  }
};

export const getTransaction = async (taskId: string) => {
  const client = getSubGraphClient();
  try {
    const response = (
      await client.request<{ transactions: { items: Transaction[]} }>(GET_TRANSACTION, { taskId })
    ).transactions.items;
    return response.length > 0 ? response[0] : null;
  } catch (error) {
    console.error("Error fetching deposits:", error);
    return null;
  }
}

export const getLastTransactionByAddress = async (address: string) => {
  const client = getSubGraphClient();
  try {
    const response = (
      await client.request<{ transactions: { items: Transaction[]} }>(GET_LAST_TRANSACTION_BY_ADDRESS, { address })
    ).transactions.items;
    return response;
  } catch (error) {
    console.error("Error fetching deposits:", error);
    return [];
  }
}

export const getSubGraphClient = () => {
  const client = new GraphQLClient(import.meta.env.VITE_SUBGRAPH_URL as string);
  return client;
};
