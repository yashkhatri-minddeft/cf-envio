import {
  BdltyTokensContract_TransferEvent_handlerContextAsync,
  BidelityFactoryEntity,
  PairContract_MintEvent_handlerContextAsync,
  TokenEntity,
  UniswapV2FactoryContract_PairCreatedEvent_eventArgs,
  UniswapV2FactoryContract_PairCreatedEvent_handlerContext,
  UniswapV2FactoryContract_PairCreatedEvent_handlerContextAsync,
  bdltyTokensEntity,
  bidelityFactoryEntity,
  eventLog,
} from "generated";
import { Contract, JsonRpcProvider, Wallet } from "ethers";
import factoryABI from "./abi/factory.abi.json";
import ERC20ABI from "./abi/erc20.abi.json";
export enum ChainId {
  SEPOLIA = 11155111,
  BSCTESTNET = 97,
  AMOY = 80002,
  ARBITRUM = 421614,
  AVALANCHE = 43113,
  FANTOM = 4002,
  OPTIMISM = 11155420,
}

export const factoryAddresses: { [chainId in ChainId]: string } = {
  [ChainId.SEPOLIA]: "0x46e1443bF8F2c1F57dCC093bd29188087D7B71B7",
  [ChainId.BSCTESTNET]: "0x0f2ce8eE8Ac81687976EdF8D0C10D2576F6D85A4",
  [ChainId.AMOY]: "0xa1749f0f055c6b85e600B1303DF4EBDCB3fc9635",
  [ChainId.ARBITRUM]: "0x448e31F4682eE1bbF36aDF44cC38f7C9d84fd262",
  [ChainId.AVALANCHE]: "0x4cd93352D611BeDaC1E28c7C68d8BB52E35eA104",
  [ChainId.FANTOM]: "0x448e31F4682eE1bbF36aDF44cC38f7C9d84fd262",
  [ChainId.OPTIMISM]: "0xC8481648F5Ff2Fe46027a4E5B49165A55DE106Fd",
};
export const rpcUrl: { [chainId in ChainId]: string } = {
  [ChainId.SEPOLIA]: process.env.SEPOLIA_RPC as string,
  [ChainId.BSCTESTNET]: process.env.BSC_RPC as string,
  [ChainId.AMOY]: process.env.AMOY_RPC as string,
  [ChainId.ARBITRUM]: process.env.ARBITRUM_RPC as string,
  [ChainId.AVALANCHE]: process.env.AVALANCHE_RPC as string,
  [ChainId.FANTOM]: process.env.FANTOM_RPC as string,
  [ChainId.OPTIMISM]: process.env.OPTMISM_RPC as string,
};

export const CFNCTokenAddress = "0x9BED7e1B07be88894bBf599b50E8189C55b0a888";

export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

// const initialFactory: bidelityFactoryEntity = {
//   id: "some",
//   chainId: 1,
//   addLiquidityFeeBP: BigInt(0),
//   removeLiquidityFeeBP: BigInt(0),
//   swapFeeBP: BigInt(0),
// };
export async function loadFactory(
  chainId: ChainId,
  context: UniswapV2FactoryContract_PairCreatedEvent_handlerContextAsync
) {
  const factoryAddress = factoryAddresses[chainId as ChainId];
  let factory = await context.BidelityFactory.get(factoryAddress);
  const provider = new JsonRpcProvider(rpcUrl[chainId]);
  const wallet = Wallet.createRandom(provider);
  const factoryContract = new Contract(factoryAddress, factoryABI, wallet);
  const swapFeeBP = await factoryContract.swapFeeBP();
  const addLiquidityFeeBP = await factoryContract.addLiquidityFeeBP();
  const removeLiquidityFeeBP = await factoryContract.removeLiquidityFeeBP();
  if (factory === undefined) {
    const initialFactory: bidelityFactoryEntity = {
      id: chainId + "-" + factoryAddress,
      address: factoryAddress,
      chainId: chainId,
      addLiquidityFeeBP: BigInt(swapFeeBP),
      removeLiquidityFeeBP: BigInt(addLiquidityFeeBP),
      swapFeeBP: BigInt(removeLiquidityFeeBP),
      pairCount: 0,

      // addLiquidityFeeBP: BigInt(0),
      // removeLiquidityFeeBP: BigInt(0),
      // swapFeeBP: BigInt(0),
    };
    context.BidelityFactory.set(initialFactory);
    factory = initialFactory;
  }
  return factory;
  // return context.BidelityFactory;
}

export async function loadBdltyToken(
  chainId: ChainId,
  context: BdltyTokensContract_TransferEvent_handlerContextAsync
) {
  let token = await context.BdltyTokens.get(chainId + "-" + CFNCTokenAddress);
  if (token === undefined) {
    const initialBdlty: bdltyTokensEntity = {
      id: chainId + "-" + CFNCTokenAddress,
      chainId: chainId,
      address: CFNCTokenAddress,
      issued: BigInt(0),
      burned: BigInt(0),
    };
    context.BdltyTokens.set(initialBdlty);
    token = initialBdlty;
  }
  return token;
}

export async function fetchTokenData(
  chainId: ChainId,
  tokenAddress: string
): Promise<TokenEntity> {
  const provider = new JsonRpcProvider(rpcUrl[chainId]);
  const wallet = Wallet.createRandom(provider);
  const ERC20 = new Contract(tokenAddress, ERC20ABI, wallet);
  const symbol = await ERC20.symbol();
  const decimals = await ERC20.decimals();
  const name = await ERC20.name();
  return {
    id: chainId + "-" + tokenAddress,
    symbol,
    decimals,
    name,
    chainId,
    address: tokenAddress,
    txCount: BigInt(0),
  };
}

export async function isCompleteMint(
  context: PairContract_MintEvent_handlerContextAsync,
  mintId: string
): Promise<boolean> {
  const mint = await context.Mint.get(mintId);
  if (!mint) {
    return false;
  }
  return mint.sender !== null; // sufficient checks
}
