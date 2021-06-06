import * as functions from 'firebase-functions';
import algoliasearch from 'algoliasearch';

const ALGOLIA_ID = functions.config().algolia.app_id;
const ALGOLIA_ADMIN_KEY = functions.config().algolia.api_key;
// const ALGOLIA_SEARCH_KEY = functions.config().algolia.search_key;

const ALGOLIA_INDEX_NAME = 'dev_channel';
const client = algoliasearch(ALGOLIA_ID, ALGOLIA_ADMIN_KEY);
export const index = client.initIndex(ALGOLIA_INDEX_NAME);

index
  .setSettings({
    attributesForFaceting: ['filterOnly(id)', 'searchable(name)'],
    // attributesForFaceting: ['filterOnly(id)', 'name'],
    // この設定の場合、nameとaboutChannelのpriorityは等しい
    // searchableAttributes: ['name,aboutChannel'],
    searchableAttributes: ['name', 'aboutChannel'],
  })
  .then((res) => {
    console.log('Algolia settings are completed.');
  });
