import assert from "assert";
import {
  TestHelpers,
  EventsSummaryEntity,
  UniswapV2Factory_AddLiquidityFeeBPChangedEntity,
} from "generated";
const { MockDb, UniswapV2Factory, Addresses } = TestHelpers;

import { GLOBAL_EVENTS_SUMMARY_KEY } from "../src/FactoryEventHandlers";
import { ONE_BI, ZERO_BI } from "../src/helper";

const MOCK_EVENTS_SUMMARY_ENTITY: EventsSummaryEntity = {
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

describe("UniswapV2Factory contract AddLiquidityFeeBPChanged event tests", () => {
  // Create mock db
  const mockDbInitial = MockDb.createMockDb();

  // Add mock EventsSummaryEntity to mock db
  const mockDbFinal = mockDbInitial.entities.EventsSummary.set(
    MOCK_EVENTS_SUMMARY_ENTITY
  );

  // Creating mock UniswapV2Factory contract AddLiquidityFeeBPChanged event
  const mockUniswapV2FactoryAddLiquidityFeeBPChangedEvent =
    UniswapV2Factory.AddLiquidityFeeBPChanged.createMockEvent({
      timestamp: 0n,
      value: 0n,
      mockEventData: {
        chainId: 1,
        blockNumber: 0,
        blockTimestamp: 0,
        blockHash:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        srcAddress: Addresses.defaultAddress,
        transactionHash:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        transactionIndex: 0,
        logIndex: 0,
      },
    });

  // Processing the event
  const mockDbUpdated = UniswapV2Factory.AddLiquidityFeeBPChanged.processEvent({
    event: mockUniswapV2FactoryAddLiquidityFeeBPChangedEvent,
    mockDb: mockDbFinal,
  });

  it("UniswapV2Factory_AddLiquidityFeeBPChangedEntity is created correctly", () => {
    // Getting the actual entity from the mock database
    let actualUniswapV2FactoryAddLiquidityFeeBPChangedEntity =
      mockDbUpdated.entities.UniswapV2Factory_AddLiquidityFeeBPChanged.get(
        mockUniswapV2FactoryAddLiquidityFeeBPChangedEvent.transactionHash +
          mockUniswapV2FactoryAddLiquidityFeeBPChangedEvent.logIndex.toString()
      );

    // Creating the expected entity
    const expectedUniswapV2FactoryAddLiquidityFeeBPChangedEntity: UniswapV2Factory_AddLiquidityFeeBPChangedEntity =
      {
        id:
          mockUniswapV2FactoryAddLiquidityFeeBPChangedEvent.transactionHash +
          mockUniswapV2FactoryAddLiquidityFeeBPChangedEvent.logIndex.toString(),
        timestamp:
          mockUniswapV2FactoryAddLiquidityFeeBPChangedEvent.params.timestamp,
        value: mockUniswapV2FactoryAddLiquidityFeeBPChangedEvent.params.value,
        eventsSummary: "GlobalEventsSummary",
      };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(
      actualUniswapV2FactoryAddLiquidityFeeBPChangedEntity,
      expectedUniswapV2FactoryAddLiquidityFeeBPChangedEntity,
      "Actual UniswapV2FactoryAddLiquidityFeeBPChangedEntity should be the same as the expectedUniswapV2FactoryAddLiquidityFeeBPChangedEntity"
    );
  });

  it("EventsSummaryEntity is updated correctly", () => {
    // Getting the actual entity from the mock database
    let actualEventsSummaryEntity = mockDbUpdated.entities.EventsSummary.get(
      GLOBAL_EVENTS_SUMMARY_KEY
    );

    // Creating the expected entity
    const expectedEventsSummaryEntity: EventsSummaryEntity = {
      ...MOCK_EVENTS_SUMMARY_ENTITY,
      uniswapV2Factory_AddLiquidityFeeBPChangedCount:
        MOCK_EVENTS_SUMMARY_ENTITY.uniswapV2Factory_AddLiquidityFeeBPChangedCount +
        ONE_BI,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(
      actualEventsSummaryEntity,
      expectedEventsSummaryEntity,
      "Actual UniswapV2FactoryAddLiquidityFeeBPChangedEntity should be the same as the expectedUniswapV2FactoryAddLiquidityFeeBPChangedEntity"
    );
  });
});
