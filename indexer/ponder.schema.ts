import { onchainTable } from "ponder";

export const NewTaskCreated = onchainTable("NewTaskCreated", (t) => ({
  id: t.text().primaryKey(),
  taskIndex: t.bigint(),
  taskCreatedBlock: t.integer(),
  from: t.text(),
  to: t.text(),
  data: t.text(),
  value: t.bigint(),
}));

export const Transaction = onchainTable("Transaction", (t) => ({
  id: t.text().primaryKey(),
  taskIndex: t.bigint(),
  from: t.text(),
  to: t.text(),
  value: t.bigint(),
  data: t.text(),
  message: t.text(),
  status: t.boolean(),
  blockTimestamp: t.bigint()
}));
