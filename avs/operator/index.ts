import { ethers } from "ethers";
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
// let chainId = 31337;
let chainId = 911867;

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
    console.log(`Signing and responding to task ${taskIndex}`);
    
    const debugData = await provider.send("debug_traceCall", [
        {
          from: task.from,
          to: task.to,
          data: task.data,
        },
        "latest"
      ]);
    const { isSafe, cause } = await getAiAnalysis(JSON.stringify(debugData), task);

    const operators = [await wallet.getAddress()];
    const signatures = [signature];
    const signedTask = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address[]", "bytes[]", "uint32"],
        [operators, signatures, ethers.toBigInt(await provider.getBlockNumber()-1)]
    );
    const causeBytes = ethers.AbiCoder.defaultAbiCoder().encode(["string"] , [cause]);
    try {
        const tx = await helloWorldServiceManager.respondToTask(
            [task.createdBlock, task.from, task.to, task.data, task.value],
            taskIndex,
            signedTask,
            isSafe,
            causeBytes,
            { gasLimit: 2000000 }
        );
        await tx.wait();
        console.log(`Responded to task with hash : ${ tx.hash }.`);
    }catch(err: any){
        console.log(`Error : ${err.message}`);
    }
};


const monitorNewTasks = async () => {

    helloWorldServiceManager.on("NewTaskCreated", async (taskIndex: number, task: any) => {
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

const getAiAnalysis = async (data: string, task: Task ) => {
    let isSafe : boolean = false;
    let analysis : string = "Analysis not available";
    try {
        const message = `
You are an expert Ethereum security analyst with extensive knowledge of phishing transaction patterns and Solidity code. Your task is to analyze a given transaction and determine if it's potentially a phishing attempt or safe.

Here are the details of the transaction you need to analyze:

Transaction from: <transaction_from>${task.to}</transaction_from>
Transaction to: <transaction_to>${task.to}</transaction_to>
Transaction value: <transaction_value>${task.value}</transaction_value>

Debug trace call result:
<debug_trace_call>
${data}
</debug_trace_call>

Please analyze this transaction carefully and determine if it's safe or potentially a phishing attempt. Follow these steps in your analysis:

1. Determine the type of transaction (transfer, approve, or contract interaction).
2. For transfers, check if it's a simple ETH transfer or involves a smart contract.
3. For approve functions, investigate the reputation of the approved contract.
4. For other contract interactions, analyze the debug_traceCall result.
5. Check if funds are sent without receiving anything in return.
6. Determine if it's a legitimate operation like staking.
7. If possible, review the smart contract's source code for potential phishing indicators.

In your analysis, consider these important points:
- Transfer transactions signed by the wallet owner are generally not phishing.
- Transfers to smart contracts with data "0x" are allowed as they are just transfer transactions.
- New smart contracts without source code are potentially suspicious.
- Legitimate staking operations may involve sending funds without immediate return.

Before providing your final assessment, use <transaction_analysis> tags to show your reasoning process. In this section:
a. Identify and quote key information from the transaction details.
b. Classify the transaction type and list evidence for the classification.
c. Analyze potential risks and legitimate scenarios, listing pros and cons for each.
d. Summarize your findings before making a final determination.

It's okay for this section to be quite long to ensure a thorough analysis. Consider multiple factors and potential false positives to ensure accurate detection.

After your analysis, provide your conclusion in the following json format:
{
  "safe": boolean,
  "cause": string
}

The "cause" string should explain your conclusion in no more than 280 characters. No additional text just the json response only.

Remember, accuracy is crucial in detecting phishing transactions. Take into account all available information and potential legitimate scenarios before making your final determination.
        `;
        const response = await axios.post(`https://autonome.alt.technology/${agentId}/chat`, {
            message: message,
        } , {
            headers: { Authorization: `Basic ${basicKey}` }
        });
        // const response = await axios.post(`http://localhost:6699/chat`, { message });
        console.log(`Response from agent : ${response.data.text}`);
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