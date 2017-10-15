import {RetrieveComments, CommentCallbacks, Comments} from 'api/types';

export default async ({root}: RetrieveComments, callbacks: CommentCallbacks): Promise<void> => {
  // Fetch the missing values.
  try {
    const {$entities}: Comments = await (await fetch(`/api/comments/${root}`)).json();
    callbacks.complete($entities[root]);
  } catch (error) {
    callbacks.error(error);
  }
};
