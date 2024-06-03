import {
  MintEntity,
  PairEntity,
  TokenEntity,
  TransactionEntity,
  UniswapV2Factory_PairCreatedEntity,
} from "generated";
import { PairContract } from "generated/src/Handlers.gen";
import {
  ADDRESS_ZERO,
  fetchTokenData,
  isCompleteMint,
  loadBdltyToken,
} from "./helper";
import { GLOBAL_EVENTS_SUMMARY_KEY } from "./FactoryEventHandlers";

PairContract.Transfer.loader(({ event, context }) => {
  context.EventsSummary.load(GLOBAL_EVENTS_SUMMARY_KEY);
});
PairContract.Transfer.handlerAsync(async ({ event, context }) => {
  const id = event.chainId + "-" + event.transactionHash;
  let transaction = await context.Transaction.get(id);
  if (transaction === undefined) {
    const initialTransacton: TransactionEntity = {
      id: id,
      chainId: event.chainId,
      blockNumber: BigInt(event.blockNumber),
      mintIds: [],
      timestamp: BigInt(event.blockTimestamp),
    };
    context.Transaction.set(initialTransacton);
    transaction = initialTransacton;
  }
  const mints = transaction.mintIds;
  const _isCompleteMint = await isCompleteMint(
    context,
    mints[mints.length - 1]
  );
  // const pair = (await context.Pair.get(
  //   event.chainId + "-" + event.srcAddress
  // )) as PairEntity;
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
      amount0: BigInt(0),
      amount1: BigInt(0),
      liquidity: BigInt(0),
      pair_id: event.chainId + "-" + event.srcAddress,
      sender: event.params.from,
      timestamp: BigInt(event.blockTimestamp),
      to: event.params.to,
      transaction_id: event.chainId + "-" + event.transactionHash,
    });
    const _mints = transaction.mintIds;
    _mints.push(id);
    context.Transaction.set({
      ...transaction,
      mintIds: _mints,
    });
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
  let token0Amount = event.params.amount0 / token0.decimals;
  let token1Amount = event.params.amount1 / token1.decimals;
  context.Mint.set({
    ...mint,
    sender: event.params.sender,
    amount0: token0Amount,
    amount1: token1Amount,
  });
  // const bdltyToken = await loadBdltyToken(event.chainId, context);
  context.Token.set({
    ...token0,
    txCount: token0.txCount + BigInt(1),
  });
  context.Token.set({
    ...token1,
    txCount: token1.txCount + BigInt(1),
  });
});
