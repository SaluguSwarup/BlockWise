/**
 * Re-exports the frozen response envelope from @blockwise/contracts (see
 * packages/contracts/docs/envelope.md) so backend modules import it from one place.
 */
export { ok, fail, isEnvelope } from '@blockwise/contracts';
