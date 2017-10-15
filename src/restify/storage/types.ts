import {FeedItem, NumberToFeedItemId} from 'api/types';
import {LIST_TYPES} from 'utils/constants';

export const enum BackgroundUpdate {
  FeedsRetrieved,
  RetrieveFeeds,
  FeedItemRetieved,
  RetrieveFeedItem,
}

export type FeedCollection = {[P in keyof LIST_TYPES]: NumberToFeedItemId};

interface ThreadMessage {
  type: BackgroundUpdate;
}
export interface FeedsRetrievedMessage extends ThreadMessage {
  feeds: FeedCollection;
  deletionCandidates: FeedItem['id'][];
}
export interface RetrieveFeedsMessage extends ThreadMessage {
  lastUpdate: FeedCollection | null;
}
export interface FeedItemRetievedMessage extends ThreadMessage {
  item: FeedItem;
}
export interface RetrieveFeedItemMessage extends ThreadMessage {
  id: FeedItem['id'];
}
