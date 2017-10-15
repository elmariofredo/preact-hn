import fetch from 'node-fetch';
import {NumberToFeedItemId, FeedItem, Details} from 'api/types';
import {LIST_TYPES} from 'utils/constants';

export async function fetchList(type: LIST_TYPES): Promise<NumberToFeedItemId> {
  try {
    const json: number[] = await (await fetch(`https://hacker-news.firebaseio.com/v0/${type}stories.json`)).json();

    return json.reduce(
      function(acc, value, index) {
        acc[index] = value;
        return acc;
      },
      {} as NumberToFeedItemId,
    );
  } catch (error) {
    console.log(`fetchList ${type}, error`, error);

    return null;
  }
}

export async function fetchItem(id: FeedItem['id']): Promise<FeedItem> {
  try {
    const {title, points, user, time, time_ago, comments_count, type, url, domain}: Details = await (await fetch(
      `https://hnpwa.com/api/v0/item/${id}.json`,
    )).json();

    return {
      id,
      title,
      points,
      user,
      time,
      time_ago,
      comments_count,
      type,
      url,
      domain,
    };
  } catch (error) {
    console.log(`Error updating item: ${id}`);
    return null;
  }
}

export async function fetchDetails(id): Promise<Details> {
  try {
    const json = await (await fetch(`https://hnpwa.com/api/v0/item/${id}.json`)).json();
    return json as Details;
  } catch (error) {
    console.log(`Error updating details: ${id}`);
    return null;
  }
}
