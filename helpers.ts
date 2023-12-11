import * as coda from "@codahq/packs-sdk";
import { GroupsSchema } from "./schemas";
import { API_BASE_URL } from "./pack"; 
import { Meta } from "./types";

export async function getSubscribersForAllGroups(context: coda.ExecutionContext){
  // get all the groups
  let url = `${API_BASE_URL}groups`
  let response = await context.fetcher.fetch({
    method: "GET",
    url
  })

  let groups = response.body.data
  let result = {}
  // for each group get the subscribers in the group and assigned them to the group
  for(let group of groups){
    
    let subscribers = await getSubscribersForGroup(group.id, 1000, context)
    // console.log(subscribers)

    // Reduce the group array to a map of subscribers with an array of the groups they belong to and return that
    subscribers.reduce( (obj, subId) => {
      if(Array.isArray(obj[subId])){
        obj[subId].push(group)
      }else{
        obj[subId]=[group]
      } 
      return obj
    },result)
  }
  // console.log(result)
  return result
}

async function getSubscribersForGroup( groupId: string, limit:number, context: coda.ExecutionContext) {
  let moreData = true
  let results = []
  let param = {limit}
  while( moreData){
    let url = coda.withQueryParams(`${API_BASE_URL}groups/${groupId}/subscribers`,param);
    let response = await context.fetcher.fetch({
        method: "GET",
        url: url,
      });

    results = [...results, ...response.body.data.map(subs => subs.id)]
    let meta = response.body.meta as Meta

    moreData = !!meta.next_cursor
    if(meta.next_cursor){
      // There are more results. Go back and get them
      param['cursor'] = meta.next_cursor
    } 
  }
  return results
}

export function formatTimestamp(date) {
  const pad = (num) => (num < 10 ? '0' + num : num);

  let year = date.getFullYear();
  let month = pad(date.getMonth() + 1);  // JavaScript months are 0-indexed.
  let day = pad(date.getDate());
  let hours = pad(date.getHours());
  let minutes = pad(date.getMinutes());
  let seconds = pad(date.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
