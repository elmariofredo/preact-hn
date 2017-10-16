import {h} from 'preact';
import {FeedItem, Details} from 'api/types';

import Loading from 'components/Loading';
import Comment from 'components/Comment';
import Text from 'components/Text';

import styles from './styles.css';

interface Props {
  data: Map<FeedItem['id'], FeedItem | Details>;
  matches?: any;
  children?: JSX.Element[];
}
export default function(props: Props): JSX.Element {
  if (!props.data || props.data === null) {
    return <Loading />;
  }

  const thisId = Number(props.matches.id);
  const item: FeedItem | Details = props.data[thisId];
  return (
    <div>
      <article class={styles.article}>
        <h1>
          <a href={item.url} class={styles.outboundLink}>
            {item.title}
          </a>
        </h1>
        {item.domain && <small class={styles.hostname}>({item.domain})</small>}
        <p class={styles.byline}>
          {item.points} points by{' '}
          <a href={`/user/${item.user}`} class={styles.link}>
            {item.user}
          </a>
        </p>
        {(item as Details).content && <Text text={(item as Details).content} />}
      </article>
      <Comment descendants={item.comments_count} root={thisId} />
    </div>
  );
}
