import { ponder } from "ponder:registry";
import { Transaction, NewTaskCreated } from "ponder:schema";
import { v4 as uuidv4 } from 'uuid';

ponder.on("ServiceManager:NewTaskCreated", async ({ event, context }) => {
    const { db } = context;
    await db.insert(NewTaskCreated).values({
        id: uuidv4(),
        taskIndex: BigInt(event.args.taskIndex),
        taskCreatedBlock: event.args.task.taskCreatedBlock,
        from: event.args.task.from,
        to: event.args.task.to,
        data: event.args.task.data,
        value: event.args.task.value
    })
    console.log(
    `Handling NewTaskCreated event from ServiceManager @ ${event.log.address}`,
  );
});

ponder.on("ServiceManager:Transaction", async ({ event, context }) => {
    const { db } = context;
    await db.insert(Transaction).values({
        id: uuidv4(),
        taskIndex: BigInt(event.args.taskIndex),
        from: event.args.from,
        to: event.args.to,
        value: event.args.value,
        data: event.args.data,
        message: event.args.message,
        status: event.args.status,
        blockTimestamp: event.block.timestamp
    })
    console.log(
    `Handling Transaction event from ServiceManager @ ${event.log.address}`,
  );
});
