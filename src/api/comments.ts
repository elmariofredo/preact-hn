import {MemoryRetrieve, MemoryStore} from 'utils/memory';
import {RetrieveComments, CommentCallbacks, Comments, Details, FeedItem} from 'api/types';

export default async ({root}: RetrieveComments, callbacks: CommentCallbacks): Promise<void> => {
  // Fetch the missing values.
  const entity: FeedItem | Details = MemoryRetrieve(root);
  if ((entity as Details).comments !== undefined) {
    callbacks.partial(entity as Details);
  }

  try {
    const {$entities}: Comments = await (await fetch(`/api/comments/${root}`)).json();
    MemoryStore($entities);
    callbacks.complete($entities[root]);
  } catch (error) {
    callbacks.error(error);
  }
};
