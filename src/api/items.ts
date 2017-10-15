import {MemoryRetrieve, MemoryStore} from 'utils/memory';
import {Items, NumberToFeedItem, RetrieveItems, ItemsCallbacks} from 'api/types';

export default async ({keys}: RetrieveItems, callbacks: ItemsCallbacks): Promise<void> => {
  // Keys are from entities table.
  let resolved: NumberToFeedItem = {};
  let anyResolved: boolean = false;
  let unresolved: NumberToFeedItem = {};
  let anyUnresolved: boolean = false;

  keys.forEach(key => {
    const entity = MemoryRetrieve(key);

    if (entity) {
      resolved[key] = entity;
      anyResolved = true;
    } else {
      unresolved[key] = null;
      anyUnresolved = true;
    }
  });

  if (anyResolved) {
    if (!anyUnresolved) {
      callbacks.complete(resolved);
      return;
    }
    callbacks.partial(resolved);
  }

  try {
    const {$entities}: Items = await (await fetch(
      `/api/items?items=${JSON.stringify(Object.keys(unresolved))}`,
    )).json();
    MemoryStore($entities);
    callbacks.complete(Object.assign(resolved, $entities));
  } catch (error) {
    callbacks.error(error);
  }
};
