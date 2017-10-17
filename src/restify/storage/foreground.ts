import uuid from 'uuid/v4';
import cp from 'child_process';
import {LIST_TYPES} from 'utils/constants';
import {fetchItem, fetchDetails} from './fetch';
import {
  FeedCollection,
  BackgroundUpdate,
  FeedsRetrievedMessage,
  RetrieveFeedsMessage,
  FeedItemRetievedMessage,
} from './types';
import {FeedItem, NumberToFeedItemId, Details, UUID} from 'api/types';

const updateThread = cp.fork('dist/server/restify.background.js'); // TODO: FIX THIS PATH, USE require('path')

const UPDATE_TIMER = 300000;
const MAXIMUM_SIMULTANEOUS_UUID = UPDATE_TIMER / 1000 / 60 * 6;
// Maximum of six hours of supported UUIDs.

let supportedUUIDs: string[] = [];
let storedFeeds: {
  // UUID: { [LIST_TYPE]: {index: ItemId, ...}, ...}
  [key: string]: FeedCollection;
} = {};

let itemDeletionCandidates: {
  [key: number]: number;
} = {};
let storedItems: {
  [key: number]: FeedItem;
} = {};

function handleNewDeletionCandidates({deletionCandidates}: FeedsRetrievedMessage): void {
  console.log('handleNewDeletionCandidates', deletionCandidates);
  deletionCandidates.forEach(candidate => {
    switch (itemDeletionCandidates[candidate]) {
      case 2:
        // Already marked for deletion twice
        // now it's time to remove it.
        delete storedItems[candidate];
        break;
      default:
        // Either not present in the candidate list, or only has been marked once.
        // Increment the marker.
        itemDeletionCandidates[candidate] = itemDeletionCandidates[candidate] ? 2 : 1;
    }
  });
}

function handleNewFeeds({feeds}: FeedsRetrievedMessage): void {
  const newUUID = uuid();
  const uuidSupportedCount = supportedUUIDs.length;

  if (uuidSupportedCount > MAXIMUM_SIMULTANEOUS_UUID) {
    const removed = supportedUUIDs.splice(0, MAXIMUM_SIMULTANEOUS_UUID - supportedUUIDs.length);

    removed.forEach(remove => {
      delete storedFeeds[remove];
    });
  }

  supportedUUIDs.push(newUUID);
  storedFeeds[newUUID] = feeds;
}

updateThread.on('message', message => {
  const {type} = message;

  if (type === BackgroundUpdate.FeedsRetrieved) {
    // This is the updated set of feeds that have been successfully retrieved.
    handleNewFeeds(message as FeedsRetrievedMessage);
    handleNewDeletionCandidates(message as FeedsRetrievedMessage);

    const {feeds} = message as FeedsRetrievedMessage;
    setTimeout(() => {
      const message: RetrieveFeedsMessage = {type: BackgroundUpdate.RetrieveFeeds, lastUpdate: feeds};
      updateThread.send(message);
    }, UPDATE_TIMER);
  } else if (type === BackgroundUpdate.FeedItemRetieved) {
    const {item} = message as FeedItemRetievedMessage;
    if (item && item.id) {
      storedItems[item.id] = item;
    }
  }
});

export function init(): void {
  const message: RetrieveFeedsMessage = {type: BackgroundUpdate.RetrieveFeeds, lastUpdate: null};
  updateThread.send(message);
}

export function getLatestUUID(): string {
  return supportedUUIDs[supportedUUIDs.length - 1];
}

export function getFeed(type: LIST_TYPES, uuid: UUID = getLatestUUID()): NumberToFeedItemId {
  if (storedFeeds[uuid] && storedFeeds[uuid] && storedFeeds[uuid][type]) {
    return storedFeeds[uuid][type];
  }

  return null;
}

export async function getFeedItem(id): Promise<FeedItem> {
  if (storedItems[id]) {
    return storedItems[id];
  }

  console.log(`${id} requested, and not in storedItems`);
  return await fetchItem(id);
}

export async function getDetailsItem(id): Promise<Details> {
  return await fetchDetails(id);
}
