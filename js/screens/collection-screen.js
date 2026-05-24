import { renderCollectionView } from "../collectibles/collection-renderer.js";
import { markCollectiblesSeen } from "../collectibles/collectible-engine.js";

/**
 * Renders the collection screen.
 */
export function renderCollectionScreen(state) {
  return renderCollectionView(state.save, state.collectionFilter || {});
}

/**
 * Returns updated save with collectibles marked as seen.
 */
export function acknowledgeNewCollectibles(saveData) {
  return markCollectiblesSeen(saveData);
}
