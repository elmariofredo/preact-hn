'use strict';

import {MemoryRetrieve, MemoryStore} from 'utils/memory';
import {ITEMS_PER_PAGE} from 'utils/constants';
import {
  UUID,
  ListRange,
  List,
  ListPage,
  NumberToFeedItemId,
  NumberToFeedItem,
  FeedItem,
  RetrieveList,
  ListCallbacks,
} from 'api/types';

let LATEST_UUID: UUID;

export function listRange(page: number): ListRange {
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + (ITEMS_PER_PAGE - 1);

  return {
    from,
    to,
  };
}

export function storeList({uuid, items, max, type, $entities}: List): void {
  MemoryStore(
    Object.assign(
      {
        [`${uuid} ${type}`]: {
          items,
          max,
          type,
        },
      },
      $entities,
    ),
  );
  setLatestUUID(uuid);
}

function deriveResponse(
  {to, from, page}: ListRange & ListPage,
  {type, uuid, items, max, $entities}: List,
): List & ListPage {
  const stored = MemoryRetrieve(uuid);

  storeList({
    uuid,
    items: Object.assign((stored && stored.items) || {}, items),
    max,
    type,
    $entities,
  });

  return {
    uuid,
    items: Object.assign(
      {},
      ...Object.keys(items)
        .filter(key => Number(key) >= from && Number(key) <= to)
        .map(key => ({[key]: items[key]})),
    ),
    type,
    page,
    max,
    $entities,
  };
}

export function setLatestUUID(uuid): void {
  LATEST_UUID = uuid;
}

export async function getList(
  {type, page = 1, uuid = LATEST_UUID}: RetrieveList,
  callbacks: ListCallbacks,
): Promise<void> {
  const list: List = (uuid && (MemoryRetrieve(`${uuid} ${type}`) as List)) || null;
  const {from, to}: ListRange = listRange(page);
  let fetchUrl: string = `/api/list/${type}?from=${from}&to=${to}`;

  if (list !== null) {
    // The memory store has data for this uuid, filter the data for the range requested (from->to).
    const cachedKeys: string[] = Object.keys(list.items).filter(itemOrder => {
      const itemOrderValue = Number(itemOrder);
      return itemOrderValue >= from && itemOrderValue <= to;
    });

    // Create a copy of the data for the range we have in-memory.
    // This allows the UI to have at least a partial response.
    let cachedItems: NumberToFeedItemId;
    let cachedEntities: NumberToFeedItem;
    cachedKeys.forEach(key => {
      const entityId: FeedItem['id'] = list.items[key];
      cachedItems[key] = entityId;
      cachedEntities[entityId] = MemoryRetrieve(entityId);
    });
    const storedResponse: List & ListPage = {
      uuid,
      items: cachedItems,
      type: list.type,
      page: Number(page),
      max: Number(list.max),
      $entities: cachedEntities,
    };

    if (cachedKeys.length >= to - from) {
      // If the filtered items (only ones within the range of from->to)
      // has a length equal to the length between from and to...
      // then all the items are present in the cachedKeys.
      callbacks.complete(storedResponse);
      return;
    } else {
      // Give the UI the partial response before we fetch the remainder.
      callbacks.partial(storedResponse);

      // Change the fetch url to include the active UUID.
      // This means we will get results for a known uuid.
      fetchUrl = `/api/list/${type}?uuid=${uuid}&from=${from}&to=${to}`;
    }
  }

  try {
    const json: List = await (await fetch(fetchUrl)).json();
    callbacks.complete(deriveResponse({to, from, page}, json));
  } catch (error) {
    callbacks.error(error);
  }
}
