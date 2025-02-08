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
      address: "0x4bB6e6967300618124b276AE79125798753D0847",
      startBlock: 10420000
    }
  },
});
