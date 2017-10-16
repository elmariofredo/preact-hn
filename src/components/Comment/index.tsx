import {h, Component} from 'preact';
//import Markup from 'preact-markup';
//TODO: Investigate switching over to Markup. <div><Markup markup={text} /></div>

import WithData from 'components/WithData';
import Loading from 'components/Loading';
import Text from 'components/Text';

import formatTime from 'utils/time';
import comments from 'api/comments';
import {Details} from 'api/types';

import styles from './styles.css';

const Error = _ => navigator.onLine && <Text text={'Unable to load comments.'} />;

interface CommentProps {
  data: Details;
  kidsOnly?: boolean;
}
function Comment({data, kidsOnly}: CommentProps): JSX.Element {
  if (!data || data === null) {
    return <Loading />;
  }

  if (kidsOnly) {
    const {comments} = data;
    return comments && <div>{comments.map(comment => <Comment data={comment} />)}</div>;
  }

  const {user, time, content, comments} = data;
  return (
    content && (
      <article class={styles.comment}>
        <header class={styles.header}>
          <a href={`/user/${user}`} class={styles.userLink}>
            {user}
          </a>
          <span class={styles.ago}>{formatTime(time)} ago</span>
        </header>
        <Text text={content} isComment={true} />
        {comments && (
          <div class={styles.kids}>{comments.map(comment => <Comment data={comment} kidsOnly={false} />)}</div>
        )}
      </article>
    )
  );
}

interface Props {
  descendants: number;
  root: number;
}
export default class Export extends Component<Props, null> {
  render({root}) {
    return <WithData source={comments} values={{root}} render={this.CommentsWithData} />;
  }

  private CommentsWithData = (data, error): JSX.Element => {
    const {descendants} = this.props;
    return (
      <div class={styles.comments}>
        {!error && <h2 class={styles.numberOfComments}>{`${descendants} comment${descendants > 1 ? 's' : ''}`}</h2>}
        {error && <Error />}
        {!error && (
          <section>
            <Comment data={data} kidsOnly={true} />
          </section>
        )}
      </div>
    );
  };
}
