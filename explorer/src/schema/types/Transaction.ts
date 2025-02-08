export interface Transaction {
    id: string,
    taskIndex: string,
    data: string,
    to: string,
    from: string,
    message: string,
    value: string,
    status: boolean,
    blockTimestamp: string
}