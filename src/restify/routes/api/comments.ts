import {getDetailsItem} from '../../storage/foreground';
import {Details} from 'api/types';

export async function route(req, res, next: () => void): Promise<void> {
  res.setHeader('content-type', 'application/json; charset=utf-8');

  const details: Details = await getDetailsItem(req.params.id);
  res.send(200, {
    $entities: {
      [req.params.id]: details,
    },
  });

  next();
}
