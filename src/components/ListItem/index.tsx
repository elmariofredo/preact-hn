import {h} from 'preact';
import formatTime from 'utils/time';
import {FeedItem} from 'api/types';

import styles from './styles.css';

interface Props {
  index: number;
  entity: FeedItem;
}
export default function({index, entity}: Props): JSX.Element {
  if (!entity) return null;

  const {url, title, points, user, time, comments_count, id} = entity;
  return (
    <article class={styles.article}>
      <span class={styles.index}>{index}</span>
      <div class={styles.metadata}>
        <h2>
          <a href={url} class={styles.outboundLink}>
            {title}
          </a>
        </h2>
        <p>
          {points} points by{' '}
          <a href={`/user/${user}`} class={styles.link}>
            {user}
          </a>{' '}
          {formatTime(time)} ago
          <a href={`/item/${id}`} class={styles.commentCount}>
            {comments_count > 1 ? `${comments_count} comments` : 'discuss'}
          </a>
        </p>
      </div>
    </article>
  );
}
