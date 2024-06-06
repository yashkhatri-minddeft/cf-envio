/*
 *Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features*
 */
import {
  UniswapV2FactoryContract,
  UniswapV2Factory_AddLiquidityFeeBPChangedEntity,
  UniswapV2Factory_FeeReceiverChangedEntity,
  UniswapV2Factory_PairCreatedEntity,
  UniswapV2Factory_RemoveLiquidityFeeBPChangedEntity,
  UniswapV2Factory_SwapFeeBPChangedEntity,
  UniswapV2Factory_SwapLimitBPChangedEntity,
  UniswapV2Factory_AdminAddedEntity,
  UniswapV2Factory_AdminRemovedEntity,
  UniswapV2Factory_LockStatusEntity,
  UniswapV2Factory_UnlockStatusEntity,
  EventsSummaryEntity,
  BidelityFactoryEntity,
  UniswapV2FactoryContract_SwapFeeBPChangedEvent_handlerContextAsync,
  BdltyTokensContract,
  bdltyTokensEntity,
} from "generated";
import {
  ADDRESS_ZERO,
  ChainId,
  ONE_BI,
  ZERO_BI,
  factoryAddresses,
  fetchTokenData,
  loadBdltyToken,
  loadFactory,
} from "./helper";

export const GLOBAL_EVENTS_SUMMARY_KEY = "GlobalEventsSummary";

const INITIAL_EVENTS_SUMMARY: EventsSummaryEntity = {
  id: GLOBAL_EVENTS_SUMMARY_KEY,
  uniswapV2Factory_AddLiquidityFeeBPChangedCount: ZERO_BI,
  uniswapV2Factory_FeeReceiverChangedCount: ZERO_BI,
  uniswapV2Factory_PairCreatedCount: ZERO_BI,
  uniswapV2Factory_RemoveLiquidityFeeBPChangedCount: ZERO_BI,
  uniswapV2Factory_SwapFeeBPChangedCount: ZERO_BI,
  uniswapV2Factory_SwapLimitBPChangedCount: ZERO_BI,
  uniswapV2Factory_AdminAddedCount: ZERO_BI,
  uniswapV2Factory_AdminRemovedCount: ZERO_BI,
  uniswapV2Factory_LockStatusCount: ZERO_BI,
  uniswapV2Factory_UnlockStatusCount: ZERO_BI,
  pairCount: ZERO_BI,
};

UniswapV2FactoryContract.AddLiquidityFeeBPChanged.loader(
  ({ event, context }) => {
    context.EventsSummary.load(GLOBAL_EVENTS_SUMMARY_KEY);
  }
);

UniswapV2FactoryContract.AddLiquidityFeeBPChanged.handlerAsync(
  async ({ event, context }) => {
    const factory = await loadFactory(event.chainId, context);
    const nextFactory: BidelityFactoryEntity = {
      ...(factory as BidelityFactoryEntity),
      addLiquidityFeeBP: event.params.value,
    };
    context.BidelityFactory.set(nextFactory);
    const summary = await context.EventsSummary.get(GLOBAL_EVENTS_SUMMARY_KEY);

    const currentSummaryEntity: EventsSummaryEntity =
      summary ?? INITIAL_EVENTS_SUMMARY;

    const nextSummaryEntity = {
      ...currentSummaryEntity,
      uniswapV2Factory_AddLiquidityFeeBPChangedCount:
        currentSummaryEntity.uniswapV2Factory_AddLiquidityFeeBPChangedCount +
        ONE_BI,
    };

    const uniswapV2Factory_AddLiquidityFeeBPChangedEntity: UniswapV2Factory_AddLiquidityFeeBPChangedEntity =
      {
        id: event.transactionHash + event.logIndex.toString(),
        timestamp: event.params.timestamp,
        value: event.params.value,
        eventsSummary: GLOBAL_EVENTS_SUMMARY_KEY,
      };

    context.EventsSummary.set(nextSummaryEntity);
    context.UniswapV2Factory_AddLiquidityFeeBPChanged.set(
      uniswapV2Factory_AddLiquidityFeeBPChangedEntity
    );
  }
);
UniswapV2FactoryContract.FeeReceiverChanged.loader(({ event, context }) => {
  context.EventsSummary.load(GLOBAL_EVENTS_SUMMARY_KEY);
});

UniswapV2FactoryContract.FeeReceiverChanged.handler(({ event, context }) => {
  const summary = context.EventsSummary.get(GLOBAL_EVENTS_SUMMARY_KEY);

  const currentSummaryEntity: EventsSummaryEntity =
    summary ?? INITIAL_EVENTS_SUMMARY;

  const nextSummaryEntity = {
    ...currentSummaryEntity,
    uniswapV2Factory_FeeReceiverChangedCount:
      currentSummaryEntity.uniswapV2Factory_FeeReceiverChangedCount + ONE_BI,
  };

  const uniswapV2Factory_FeeReceiverChangedEntity: UniswapV2Factory_FeeReceiverChangedEntity =
    {
      id: event.transactionHash + event.logIndex.toString(),
      timestamp: event.params.timestamp,
      feeTo: event.params.feeTo,
      eventsSummary: GLOBAL_EVENTS_SUMMARY_KEY,
    };

  context.EventsSummary.set(nextSummaryEntity);
  context.UniswapV2Factory_FeeReceiverChanged.set(
    uniswapV2Factory_FeeReceiverChangedEntity
  );
});
UniswapV2FactoryContract.PairCreated.loader(({ event, context }) => {
  context.contractRegistration.addPair(event.params.pair);
  context.EventsSummary.load(GLOBAL_EVENTS_SUMMARY_KEY);
});

UniswapV2FactoryContract.PairCreated.handlerAsync(
  async ({ event, context }) => {
    const factory = (await loadFactory(
      event.chainId,
      context
    )) as BidelityFactoryEntity;
    const nextFactory: BidelityFactoryEntity = {
      ...(factory as BidelityFactoryEntity),
      pairCount: factory.pairCount + 1,
    };
    context.BidelityFactory.set(nextFactory);
    const summary = await context.EventsSummary.get(GLOBAL_EVENTS_SUMMARY_KEY);

    const currentSummaryEntity: EventsSummaryEntity =
      summary ?? INITIAL_EVENTS_SUMMARY;

    const nextSummaryEntity = {
      ...currentSummaryEntity,
      uniswapV2Factory_PairCreatedCount:
        currentSummaryEntity.uniswapV2Factory_PairCreatedCount + ONE_BI,
      pairCount: currentSummaryEntity.pairCount + ONE_BI,
    };
    let token0 = await context.Token.get(
      event.chainId + "-" + event.params.token0
    );
    if (token0 === undefined) {
      token0 = await fetchTokenData(event.chainId, event.params.token0);
      context.Token.set(token0);
    }

    let token1 = await context.Token.get(
      event.chainId + "-" + event.params.token1
    );
    if (token1 === undefined) {
      token1 = await fetchTokenData(event.chainId, event.params.token1);
      context.Token.set(token1);
    }
    // const token1 = await fetchTokenData(event.chainId, event.params.token1);
    // context.Token.set(token1);
    const uniswapV2Factory_PairCreatedEntity: UniswapV2Factory_PairCreatedEntity =
      {
        id: event.chainId.toString().concat("-").concat(event.params.pair),
        token0_id: token0.id,
        token1_id: token1.id,
        pair: event.params.pair,
        _3: event.params._3,
        eventsSummary: GLOBAL_EVENTS_SUMMARY_KEY,
        chainId: event.chainId,
      };

    context.EventsSummary.set(nextSummaryEntity);
    context.UniswapV2Factory_PairCreated.set(
      uniswapV2Factory_PairCreatedEntity
    );

    context.Pair.set({
      id: event.chainId.toString().concat("-").concat(event.params.pair),
      chainId: event.chainId,
      address: event.params.pair,
      token0_id: token0.id,
      token1_id: token1.id,
      burned: ZERO_BI,
      issued: ZERO_BI,
      reserve0: ZERO_BI,
      reserve1: ZERO_BI,
      totalSupply: ZERO_BI,
      _3: event.params._3,
      eventsSummary: GLOBAL_EVENTS_SUMMARY_KEY,
      token0Price: ZERO_BI,
      token1Price: ZERO_BI,
    });
  }
);
UniswapV2FactoryContract.RemoveLiquidityFeeBPChanged.loader(
  ({ event, context }) => {
    context.EventsSummary.load(GLOBAL_EVENTS_SUMMARY_KEY);
  }
);

UniswapV2FactoryContract.RemoveLiquidityFeeBPChanged.handlerAsync(
  async ({ event, context }) => {
    const factory = await loadFactory(event.chainId, context);
    const nextFactory: BidelityFactoryEntity = {
      ...(factory as BidelityFactoryEntity),
      removeLiquidityFeeBP: event.params.value,
    };
    context.BidelityFactory.set(nextFactory);
    const summary = await context.EventsSummary.get(GLOBAL_EVENTS_SUMMARY_KEY);

    const currentSummaryEntity: EventsSummaryEntity =
      summary ?? INITIAL_EVENTS_SUMMARY;

    const nextSummaryEntity = {
      ...currentSummaryEntity,
      uniswapV2Factory_RemoveLiquidityFeeBPChangedCount:
        currentSummaryEntity.uniswapV2Factory_RemoveLiquidityFeeBPChangedCount +
        ONE_BI,
    };

    const uniswapV2Factory_RemoveLiquidityFeeBPChangedEntity: UniswapV2Factory_RemoveLiquidityFeeBPChangedEntity =
      {
        id: event.transactionHash + event.logIndex.toString(),
        timestamp: event.params.timestamp,
        value: event.params.value,
        eventsSummary: GLOBAL_EVENTS_SUMMARY_KEY,
      };

    context.EventsSummary.set(nextSummaryEntity);
    context.UniswapV2Factory_RemoveLiquidityFeeBPChanged.set(
      uniswapV2Factory_RemoveLiquidityFeeBPChangedEntity
    );
  }
);
UniswapV2FactoryContract.SwapFeeBPChanged.loader(({ event, context }) => {
  context.EventsSummary.load(GLOBAL_EVENTS_SUMMARY_KEY);
});

UniswapV2FactoryContract.SwapFeeBPChanged.handlerAsync(
  async ({ event, context }) => {
    const factory = await loadFactory(event.chainId, context);
    const nextFactory: BidelityFactoryEntity = {
      ...(factory as BidelityFactoryEntity),
      swapFeeBP: event.params.value,
    };
    context.BidelityFactory.set(nextFactory);
    const summary = await context.EventsSummary.get(GLOBAL_EVENTS_SUMMARY_KEY);

    const currentSummaryEntity: EventsSummaryEntity =
      summary ?? INITIAL_EVENTS_SUMMARY;

    const nextSummaryEntity = {
      ...currentSummaryEntity,
      uniswapV2Factory_SwapFeeBPChangedCount:
        currentSummaryEntity.uniswapV2Factory_SwapFeeBPChangedCount + ONE_BI,
    };

    const uniswapV2Factory_SwapFeeBPChangedEntity: UniswapV2Factory_SwapFeeBPChangedEntity =
      {
        id: event.transactionHash + event.logIndex.toString(),
        timestamp: event.params.timestamp,
        value: event.params.value,
        eventsSummary: GLOBAL_EVENTS_SUMMARY_KEY,
      };

    context.EventsSummary.set(nextSummaryEntity);
    context.UniswapV2Factory_SwapFeeBPChanged.set(
      uniswapV2Factory_SwapFeeBPChangedEntity
    );
  }
);
UniswapV2FactoryContract.SwapLimitBPChanged.loader(({ event, context }) => {
  context.EventsSummary.load(GLOBAL_EVENTS_SUMMARY_KEY);
});

UniswapV2FactoryContract.SwapLimitBPChanged.handler(({ event, context }) => {
  const summary = context.EventsSummary.get(GLOBAL_EVENTS_SUMMARY_KEY);

  const currentSummaryEntity: EventsSummaryEntity =
    summary ?? INITIAL_EVENTS_SUMMARY;

  const nextSummaryEntity = {
    ...currentSummaryEntity,
    uniswapV2Factory_SwapLimitBPChangedCount:
      currentSummaryEntity.uniswapV2Factory_SwapLimitBPChangedCount + ONE_BI,
  };

  const uniswapV2Factory_SwapLimitBPChangedEntity: UniswapV2Factory_SwapLimitBPChangedEntity =
    {
      id: event.transactionHash + event.logIndex.toString(),
      timestamp: event.params.timestamp,
      value: event.params.value,
      eventsSummary: GLOBAL_EVENTS_SUMMARY_KEY,
    };

  context.EventsSummary.set(nextSummaryEntity);
  context.UniswapV2Factory_SwapLimitBPChanged.set(
    uniswapV2Factory_SwapLimitBPChangedEntity
  );
});
UniswapV2FactoryContract.AdminAdded.loader(({ event, context }) => {
  context.EventsSummary.load(GLOBAL_EVENTS_SUMMARY_KEY);
});

UniswapV2FactoryContract.AdminAdded.handler(({ event, context }) => {
  const summary = context.EventsSummary.get(GLOBAL_EVENTS_SUMMARY_KEY);

  const currentSummaryEntity: EventsSummaryEntity =
    summary ?? INITIAL_EVENTS_SUMMARY;

  const nextSummaryEntity = {
    ...currentSummaryEntity,
    uniswapV2Factory_AdminAddedCount:
      currentSummaryEntity.uniswapV2Factory_AdminAddedCount + ONE_BI,
  };

  const uniswapV2Factory_AdminAddedEntity: UniswapV2Factory_AdminAddedEntity = {
    id: event.transactionHash + event.logIndex.toString(),
    timestamp: event.params.timestamp,
    admin: event.params.admin,
    eventsSummary: GLOBAL_EVENTS_SUMMARY_KEY,
  };

  context.EventsSummary.set(nextSummaryEntity);
  context.UniswapV2Factory_AdminAdded.set(uniswapV2Factory_AdminAddedEntity);
});
UniswapV2FactoryContract.AdminRemoved.loader(({ event, context }) => {
  context.EventsSummary.load(GLOBAL_EVENTS_SUMMARY_KEY);
});

UniswapV2FactoryContract.AdminRemoved.handler(({ event, context }) => {
  const summary = context.EventsSummary.get(GLOBAL_EVENTS_SUMMARY_KEY);

  const currentSummaryEntity: EventsSummaryEntity =
    summary ?? INITIAL_EVENTS_SUMMARY;

  const nextSummaryEntity = {
    ...currentSummaryEntity,
    uniswapV2Factory_AdminRemovedCount:
      currentSummaryEntity.uniswapV2Factory_AdminRemovedCount + ONE_BI,
  };

  const uniswapV2Factory_AdminRemovedEntity: UniswapV2Factory_AdminRemovedEntity =
    {
      id: event.transactionHash + event.logIndex.toString(),
      timestamp: event.params.timestamp,
      admin: event.params.admin,
      eventsSummary: GLOBAL_EVENTS_SUMMARY_KEY,
    };

  context.EventsSummary.set(nextSummaryEntity);
  context.UniswapV2Factory_AdminRemoved.set(
    uniswapV2Factory_AdminRemovedEntity
  );
});
UniswapV2FactoryContract.LockStatus.loader(({ event, context }) => {
  context.EventsSummary.load(GLOBAL_EVENTS_SUMMARY_KEY);
});

UniswapV2FactoryContract.LockStatus.handler(({ event, context }) => {
  const summary = context.EventsSummary.get(GLOBAL_EVENTS_SUMMARY_KEY);

  const currentSummaryEntity: EventsSummaryEntity =
    summary ?? INITIAL_EVENTS_SUMMARY;

  const nextSummaryEntity = {
    ...currentSummaryEntity,
    uniswapV2Factory_LockStatusCount:
      currentSummaryEntity.uniswapV2Factory_LockStatusCount + ONE_BI,
  };

  const uniswapV2Factory_LockStatusEntity: UniswapV2Factory_LockStatusEntity = {
    id: event.transactionHash + event.logIndex.toString(),
    timestamp: event.params.timestamp,
    pool: event.params.pool,
    eventsSummary: GLOBAL_EVENTS_SUMMARY_KEY,
  };

  context.EventsSummary.set(nextSummaryEntity);
  context.UniswapV2Factory_LockStatus.set(uniswapV2Factory_LockStatusEntity);
});
UniswapV2FactoryContract.UnlockStatus.loader(({ event, context }) => {
  context.EventsSummary.load(GLOBAL_EVENTS_SUMMARY_KEY);
});

UniswapV2FactoryContract.UnlockStatus.handler(({ event, context }) => {
  const summary = context.EventsSummary.get(GLOBAL_EVENTS_SUMMARY_KEY);

  const currentSummaryEntity: EventsSummaryEntity =
    summary ?? INITIAL_EVENTS_SUMMARY;

  const nextSummaryEntity = {
    ...currentSummaryEntity,
    uniswapV2Factory_UnlockStatusCount:
      currentSummaryEntity.uniswapV2Factory_UnlockStatusCount + ONE_BI,
  };

  const uniswapV2Factory_UnlockStatusEntity: UniswapV2Factory_UnlockStatusEntity =
    {
      id: event.transactionHash + event.logIndex.toString(),
      timestamp: event.params.timestamp,
      pool: event.params.pool,
      eventsSummary: GLOBAL_EVENTS_SUMMARY_KEY,
    };

  context.EventsSummary.set(nextSummaryEntity);
  context.UniswapV2Factory_UnlockStatus.set(
    uniswapV2Factory_UnlockStatusEntity
  );
});
