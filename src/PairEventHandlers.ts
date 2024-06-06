import {
  MintEntity,
  PairEntity,
  SwapEntity,
  TokenEntity,
  TransactionEntity,
} from "generated";
import { PairContract } from "generated/src/Handlers.gen";
import {
  ADDRESS_ZERO,
  ChainId,
  ONE_BI,
  ZERO_BI,
  formatDecimals,
  isCompleteMint,
  rpcUrl,
  toWei,
} from "./helper";
import { GLOBAL_EVENTS_SUMMARY_KEY } from "./FactoryEventHandlers";
import { JsonRpcProvider, Transaction, TransactionResponse } from "ethers";

PairContract.Transfer.loader(({ event, context }) => {
  context.EventsSummary.load(GLOBAL_EVENTS_SUMMARY_KEY);
});
PairContract.Transfer.handlerAsync(async ({ event, context }) => {
  if (
    event.params.to == ADDRESS_ZERO &&
    event.params.value.toString() == BigInt(1000).toString()
  ) {
    return;
  }
  const id = event.chainId + "-" + event.transactionHash;
  const from = event.params.from;
  const pair = (await context.Pair.get(
    event.chainId.toString().concat("-").concat(event.srcAddress)
  )) as PairEntity;

  let transaction = await context.Transaction.get(id);
  if (transaction === undefined) {
    const initialTransaction: TransactionEntity = {
      id: id,
      chainId: event.chainId,
      blockNumber: BigInt(event.blockNumber),
      mintIds: [],
      swapIds: [],
      timestamp: BigInt(event.blockTimestamp),
    };
    context.Transaction.set(initialTransaction);
    transaction = initialTransaction;
  }

  // mints
  const mints = transaction.mintIds;
  if (from === ADDRESS_ZERO) {
    context.Pair.set({
      ...pair,
      totalSupply: pair.totalSupply + event.params.value,
    });
    const _isCompleteMint = await isCompleteMint(
      context,
      mints[mints.length - 1]
    );
    if (mints.length === 0 || _isCompleteMint) {
      const id =
        event.chainId +
        "-" +
        event.transactionHash +
        "-" +
        mints.length.toString();
      context.Mint.set({
        id: id,
        chainId: event.chainId,
        amount0: ZERO_BI,
        amount1: ZERO_BI,
        liquidity: ZERO_BI,
        pair_id: event.chainId + "-" + event.srcAddress,
        sender: undefined,
        timestamp: BigInt(event.blockTimestamp),
        to: event.params.to,
        transaction_id: event.chainId + "-" + event.transactionHash,
        logIndex: BigInt(event.logIndex),
      });
      const _mints = transaction.mintIds;
      _mints.push(id);
      context.Transaction.set({
        ...transaction,
        mintIds: _mints,
      });
    }
  }
});
PairContract.Mint.loader(({ event, context }) => {
  context.EventsSummary.load(GLOBAL_EVENTS_SUMMARY_KEY);
});
PairContract.Mint.handlerAsync(async ({ event, context }) => {
  const pair = (await context.Pair.get(
    event.chainId.toString().concat("-").concat(event.srcAddress)
  )) as PairEntity;
  let transaction = (await context.Transaction.get(
    event.chainId + "-" + event.transactionHash
  )) as TransactionEntity;
  let mints = transaction.mintIds;
  const mint = (await context.Mint.get(mints[mints.length - 1])) as MintEntity;
  // const bdltyToken = await loadBdltyToken(event.chainId, context);
  let token0 = (await context.Token.get(pair.token0_id)) as TokenEntity;
  let token1 = (await context.Token.get(pair.token1_id)) as TokenEntity;
  let token0Amount = event.params.amount0;
  let token1Amount = event.params.amount1;

  context.Mint.set({
    ...mint,
    sender: event.params.sender,
    amount0: token0Amount,
    amount1: token1Amount,
  });
  // const bdltyToken = await loadBdltyToken(event.chainId, context);
  context.Token.set({
    ...token0,
    txCount: token0.txCount + ONE_BI,
  });
  context.Token.set({
    ...token1,
    txCount: token1.txCount + ONE_BI,
  });
});

// swap event
PairContract.Swap.handlerAsync(async ({ event, context }) => {
  const chainId = event.chainId;
  const pairId = chainId.toString().concat("-").concat(event.srcAddress);
  const pair = (await context.Pair.get(pairId)) as PairEntity;
  const token0 = (await context.Token.get(pair.token0_id)) as TokenEntity;
  const token1 = (await context.Token.get(pair.token1_id)) as TokenEntity;

  let transaction = await context.Transaction.get(
    event.chainId + "-" + event.transactionHash
  );
  if (transaction === undefined) {
    let initialTransaction = {
      id: event.chainId + "-" + event.transactionHash,
      blockNumber: BigInt(event.blockNumber),
      timestamp: BigInt(event.blockTimestamp),
      chainId: event.chainId,
      mintIds: [],
      swapIds: [],
    };

    context.Transaction.set(initialTransaction);
    transaction = initialTransaction;
  }
  let swaps = transaction.swapIds;

  // const swap = (await context.Swap.get(swaps[swaps.length - 1])) as SwapEntity;
  const amount0In = event.params.amount0In;
  const amount1In = event.params.amount1In;
  const amount0Out = event.params.amount0Out;
  const amount1Out = event.params.amount1Out;

  const id =
    event.chainId + "-" + event.transactionHash + "-" + swaps.length.toString();

  const provider = new JsonRpcProvider(rpcUrl[event.chainId as ChainId]);
  const transactionTX = (await provider.getTransaction(
    event.transactionHash
  )) as TransactionResponse;
  const fromAddress = transactionTX.from;
  // const transactionTX = Transaction.from(event.transactionHash);
  // const fromAddress = transactionTX.from ? transactionTX.from : ADDRESS_ZERO;
  context.Swap.set({
    id: id,
    chainId: event.chainId,
    amount0In: amount0In,
    amount1In: amount1In,
    amount0Out: amount0Out,
    amount1Out: amount1Out,
    fee: event.params.fee,
    sender: event.params.sender,
    hash: event.transactionHash,
    logIndex: BigInt(event.logIndex),
    pair_id: pair.id,
    timestamp: transaction.timestamp,
    to: event.params.to,
    token0Price: pair.token0Price,
    token1Price: pair.token1Price,
    transaction_id: transaction.id,
    from: fromAddress,
  });

  // context.Swap.set({
  //   id:
  // })
});
// sync event
PairContract.Sync.handlerAsync(async ({ event, context }) => {
  const chainId = event.chainId;
  const pairId = chainId.toString().concat("-").concat(event.srcAddress);
  const pair = (await context.Pair.get(pairId)) as PairEntity;
  const token0 = (await context.Token.get(pair.token0_id)) as TokenEntity;
  const token1 = (await context.Token.get(pair.token1_id)) as TokenEntity;

  context.Token.set({
    ...token0,
    totalLiquidity: token0.totalLiquidity - pair.reserve0,
  });

  context.Token.set({
    ...token1,
    totalLiquidity: token1.totalLiquidity - pair.reserve1,
  });

  const reserve0 = event.params.reserve0;
  const reserve1 = event.params.reserve1;
  let token0Price = ZERO_BI;
  let token1Price = ZERO_BI;
  if (reserve1 !== ZERO_BI)
    // token0Price = BigInt(
    //   (Number(reserve0.valueOf().toString()) /
    //     Number(reserve1.valueOf().toString())) *
    //     10 ** 18
    // );
    token0Price =
      formatDecimals(toWei(reserve0), token1.decimals) /
      formatDecimals(reserve1, token0.decimals);

  if (reserve0 !== ZERO_BI)
    token1Price =
      formatDecimals(toWei(reserve1), token0.decimals) /
      formatDecimals(reserve0, token1.decimals);
  // token1Price = BigInt(
  //   (Number(reserve1.valueOf().toString()) /
  //     Number(reserve0.valueOf().toString())) *
  //     10 ** 18
  // );

  context.Pair.set({
    ...pair,
    reserve0: reserve0,
    reserve1: reserve1,
    token0Price: token0Price,
    token1Price: token1Price,
  });

  context.Token.set({
    ...token0,
    totalLiquidity: token0.totalLiquidity + reserve0,
  });

  context.Token.set({
    ...token1,
    totalLiquidity: token1.totalLiquidity + reserve1,
  });
});
