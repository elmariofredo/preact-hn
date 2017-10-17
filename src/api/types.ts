import {LIST_TYPES} from 'utils/constants';

export type UUID = string;
export type NumberToFeedItemId = {
  [key: number]: FeedItem['id'];
};
export type NumberToFeedItem = {
  [key: number]: FeedItem;
};

export interface FeedItem {
  id: number;
  title: string;
  points?: number | null;
  user?: string | null;
  time: number;
  time_ago: string;
  comments_count: number;
  type: string;
  url?: string;
  domain?: string;
}

export interface Details extends FeedItem {
  content: string;
  deleted?: boolean;
  dead?: boolean;
  comments: Details[]; // Comments are details too
  level: number;
}

export interface ListRange {
  from: number;
  to: number;
}
export interface ListPage {
  page: number;
}
export interface List {
  uuid: UUID;
  items: NumberToFeedItemId;
  type: LIST_TYPES;
  max: number;
  $entities: NumberToFeedItem;
}

// Comments Browser API
export interface RetrieveComments {
  root: Details['id'];
}
export interface Comments {
  $entities: Details;
}
export interface CommentCallbacks {
  partial: (partialComments: Details | FeedItem) => void;
  complete: (completeComments: Details) => void;
  error: (error: any) => void;
}

// Items Browser API
export interface RetrieveItems {
  keys: FeedItem['id'][];
}
export interface Items {
  $entities: Map<FeedItem['id'], FeedItem>;
}
export interface ItemsCallbacks {
  partial: (partialItems: NumberToFeedItem) => void;
  complete: (completeItems: NumberToFeedItem) => void;
  error: (error: any) => void;
}

// List Browser API
export interface RetrieveList extends ListPage {
  type: LIST_TYPES;
  uuid: UUID;
}
export interface ListCallbacks {
  partial: (partialList: List & ListPage) => void;
  complete: (completelist: List & ListPage) => void;
  error: (error: any) => void;
}
