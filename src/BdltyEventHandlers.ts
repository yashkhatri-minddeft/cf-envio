import { BdltyTokensContract, bdltyTokensEntity } from "generated";
import { ADDRESS_ZERO, loadBdltyToken } from "./helper";

BdltyTokensContract.Transfer.handlerAsync(async ({ event, context }) => {
  const token = await loadBdltyToken(event.chainId, context);
  if (event.params.to.toString() === ADDRESS_ZERO) {
    const nextBdlty: bdltyTokensEntity = {
      ...(token as bdltyTokensEntity),
      burned: token.burned + event.params.value,
    };
    context.BdltyTokens.set(nextBdlty);
  }
  if (event.params.from.toString() === ADDRESS_ZERO) {
    const nextBdlty: bdltyTokensEntity = {
      ...(token as bdltyTokensEntity),
      issued: token.issued + event.params.value,
    };
    context.BdltyTokens.set(nextBdlty);
  }
});
