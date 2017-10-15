import {h} from 'preact';
import {FeedItem, Details} from 'api/types';

import Loading from 'components/Loading';
import Comment from 'components/Comment';

import styles from './styles.css';

interface Props {
  data: Map<FeedItem['id'], FeedItem | Details>;
  matches?: any;
  children?: JSX.Element[];
}
export default function({matches: {id}, data}: Props): JSX.Element {
  if (!data || data === null) {
    return <Loading />;
  }

  const thisId = Number(id);
  const {url, title, points, user, comments_count = 0}: FeedItem | Details = data[thisId];
  return (
    <div>
      <article class={styles.article}>
        <h1>
          <a href={url} class={styles.outboundLink}>
            {title}
          </a>
        </h1>
        {url && <small class={styles.hostname}>({new URL(url).hostname})</small>}
        <p class={styles.byline}>
          {points} points by{' '}
          <a href={`/user/${user}`} class={styles.link}>
            {user}
          </a>
        </p>
      </article>
      <Comment descendants={comments_count} root={thisId} />
    </div>
  );
}
