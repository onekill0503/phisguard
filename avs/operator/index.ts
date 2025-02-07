import { ethers, encodeBytes32String } from "ethers";
import * as dotenv from "dotenv";
import axios from "axios";
const fs = require('fs');
const path = require('path');
dotenv.config();
const basicKey: string = process.env.AUTONOME_KEY!;
const agentId: string = process.env.AUTONOME_AGENT_ID!;

// Check if the process.env object is empty
if (!Object.keys(process.env).length) {
    throw new Error("process.env object is empty");
}

// Setup env variables
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
/// TODO: Hack
let chainId = 31337;

const avsDeploymentData = JSON.parse(fs.readFileSync(path.resolve(__dirname, `../contracts/deployments/hello-world/${chainId}.json`), 'utf8'));

const helloWorldServiceManagerAddress = avsDeploymentData.addresses.helloWorldServiceManager;


const helloWorldServiceManagerABI = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../abis/HelloWorldServiceManager.json'), 'utf8'));

const helloWorldServiceManager = new ethers.Contract(helloWorldServiceManagerAddress, helloWorldServiceManagerABI, wallet);

interface Task {
    createdBlock: number,
    from: string,
    to: string,
    data: string,
    value: string
}

const signAndRespondToTask = async (taskIndex: number, task: Task) => {
    const messageHash = ethers.solidityPackedKeccak256(["address","address","bytes","uint256"], [task.from, task.to, task.data, task.value]);
    const messageBytes = ethers.getBytes(messageHash);
    const signature = await wallet.signMessage(messageBytes);
    console.log(task);
    console.log(`Signing and responding to task ${taskIndex}`);

    // Analisi By Ai (INCLUDE SIMULASI)
    const debugData = await provider.send("debug_traceCall", [
        {
          from: task.from,
          to: task.to,
          data: task.data,
        },
        ["trace"],
        "latest",
      ]);
    console.log(debugData);
    const { isSafe, cause } = await getAiAnalysis(debugData);


    const operators = [await wallet.getAddress()];
    const signatures = [signature];
    const signedTask = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address[]", "bytes[]", "uint32"],
        [operators, signatures, ethers.toBigInt(await provider.getBlockNumber()-1)]
    );

    const tx = await helloWorldServiceManager.respondToTask(
        [task.createdBlock, task.from, task.to, task.data, task.value],
        taskIndex,
        signedTask,
        isSafe,
        encodeBytes32String(cause)
    );
    await tx.wait();
    console.log(`Responded to task.`);
};


const monitorNewTasks = async () => {

    helloWorldServiceManager.on("NewTaskCreated", async (taskIndex: number, task: any) => {
        console.log(task)
        console.log(`New task detected: From ${task.from}`);
        await signAndRespondToTask(taskIndex, {
            createdBlock: task[0],
            from: task[1],
            to: task[2],
            data: task[3],
            value: task[4]
        });
    });

    console.log("Monitoring for new tasks...");
};

const getAiAnalysis = async (data: string ) => {
    let isSafe : boolean = false;
    let analysis : string = "Analysis not available";
    try {
        const message = `Hey, Can you analyze this result of debug_traceCall for me? ${data}, is this possibly phishing or not safe ?. response with json format { safe: boolean, cause: string }.`;
        const response = await axios.post(`https://autonome.alt.technology/${agentId}/chat`, {
            message: message,
        } , {
            headers: { Authorization: `Basic ${basicKey}` }
        });
        const responseJSON = JSON.parse(response.data.text);
        isSafe = responseJSON.safe;
        analysis = responseJSON.cause;
    }catch(err: any){
        console.log(`Error : ${err.message}`)
    }
    return { isSafe, cause: analysis };
}

const main = async () => {
    // await registerOperator();
    monitorNewTasks().catch((error) => {
        console.error("Error monitoring tasks:", error);
    });
};

main().catch((error) => {
    console.error("Error in main function:", error);
});