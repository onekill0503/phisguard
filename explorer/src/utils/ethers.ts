
import { formatEther, JsonRpcProvider } from 'ethers';
const provider = new JsonRpcProvider(import.meta.env.VITE_RPC_URL as string);

export const getTimestamp = async (blockNumber: string) => {
    const block = await provider.getBlock(blockNumber);
    return block?.timestamp ?? 0;
}

export const getWalletBalance = async ( address: string ) => {
    const balance = await provider.getBalance(address);
    return formatEther(balance);
}