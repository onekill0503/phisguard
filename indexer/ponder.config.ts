import { parseAbi, parseAbiItem } from "abitype";
import { createConfig, factory } from "ponder";

import { http } from "viem";

import { ServiceManagerAbi } from "./abis/ServiceManagerAbi";

export default createConfig({
  networks: {
    odyssey: {
      chainId: 911867,
      transport: http(process.env.PONDER_RPC_URL_911867),
    },
  },
  contracts: {
    ServiceManager: {
      network: "odyssey",
      abi: ServiceManagerAbi,
      address: "0xAbAF047F0CfeFf09e21739A1BCc1ae58147f8B11",
      startBlock: 10420000
    }
  },
});
