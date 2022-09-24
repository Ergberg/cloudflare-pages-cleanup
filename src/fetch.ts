import { accountAPI, DEBUG, headers } from "./config";

export async function fetchList(endpoint: string) {
  let allResults: object[] = [];
  let onThisPage;
  let json: { result: object[]; result_info: { total_count: number } };
  let page = 0;
  do {
    const url = `${accountAPI}${endpoint}?page=${++page}`;
    DEBUG && console.log("fetch: ", url);
    const fetched = await fetch(url, { headers });
    json = await fetched.json();
    onThisPage = json?.result ?? [];
    allResults = [...allResults, ...onThisPage];
  } while (
    onThisPage.length &&
    allResults.length < json.result_info.total_count
  );
  return allResults;
}
