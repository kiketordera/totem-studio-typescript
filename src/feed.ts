import type { FeedItem, FeedRemoval } from './types.js'

/** True when a changes-feed item removes its record (it has `removed`, not `object`). Check it before reading `object`. */
export function isFeedRemoval(item: FeedItem): item is FeedRemoval {
  const removed = (item as { removed?: unknown }).removed
  return typeof removed === 'object' && removed !== null
}
