import {getFeedItem} from 'storage/foreground';

async function getEntities(items) {
  return await items.reduce(async function(acc, cur, index) {
    const item = await getFeedItem(cur);
    if (item !== null) {
      acc[item.id] = item;
    }
    return acc;
  }, {});
}

export async function route(req, res, next: () => void): Promise<void> {
  res.setHeader('content-type', 'application/json; charset=utf-8');

  const ItemsToRetrieve = JSON.parse(req.query.items);
  const entities = await getEntities(ItemsToRetrieve);

  res.send(200, {
    $entities: entities,
  });

  next();
}
