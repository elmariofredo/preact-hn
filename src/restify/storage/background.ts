import {LIST_TYPES} from 'utils/constants';
import {fetchItem, fetchList} from './fetch';
import {FeedItem, NumberToFeedItemId} from 'api/types';
import {
  BackgroundUpdate,
  FeedCollection,
  RetrieveFeedsMessage,
  RetrieveFeedItemMessage,
  FeedItemRetievedMessage,
} from './types';

// Update a single item.
async function updateItem(id: number): Promise<boolean> {
  try {
    const item = await fetchItem(id);
    const update: FeedItemRetievedMessage = {
      type: BackgroundUpdate.FeedItemRetieved,
      item,
    };

    process.send(update);

    return true;
  } catch (error) {
    console.log(`unable to update ${id}`, error);

    return true;
  }
}

// Fetch a list of specific type, and update all the items in the list.
async function updateListItems(type: LIST_TYPES): Promise<NumberToFeedItemId> {
  const list: NumberToFeedItemId = await fetchList(type);

  for (const id in list) {
    updateItem(list[id]);
  }

  return list;
}

function findDeletionCandidates(newLists: FeedCollection, oldLists: FeedCollection): FeedItem['id'][] {
  if (newLists === null || oldLists === null) {
    return [];
  }

  let flatNewLists: FeedItem['id'][] = [];
  Object.values(newLists).forEach((list, index) => {
    flatNewLists = flatNewLists.concat(Object.values(list));
  });
  let flatOldLists: FeedItem['id'][] = [];
  Object.values(oldLists).forEach((list, index) => {
    flatOldLists = flatOldLists.concat(Object.values(list));
  });

  return flatNewLists.filter(feedItemId => !flatOldLists.includes(feedItemId));
}

process.on('message', async message => {
  const {type} = message;

  if (type === BackgroundUpdate.RetrieveFeeds) {
    const {lastUpdate} = message as RetrieveFeedsMessage;

    const newLists: FeedCollection = {
      top: await updateListItems('top'),
      new: await updateListItems('new'),
      show: await updateListItems('show'),
      ask: await updateListItems('ask'),
      job: await updateListItems('job'),
    };

    const deletionCandidates = findDeletionCandidates(newLists, lastUpdate);

    process.send({
      type: BackgroundUpdate.FeedsRetrieved,
      feeds: newLists,
      deletionCandidates,
    });

    return;
  } else if (type === BackgroundUpdate.RetrieveFeedItem) {
    const {id} = message as RetrieveFeedItemMessage;

    await updateItem(id);

    return;
  }
});

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Background Rejection at:', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});
