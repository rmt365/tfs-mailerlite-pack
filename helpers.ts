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

function formatTimestamp(date, timezone) {
  let formatter = new Intl.DateTimeFormat("en", {
    timeZone: timezone || "US/Eastern",
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric', 
    hour12: false
  });

  // Format the date into individual parts.
  const parts = formatter.formatToParts(date).reduce((obj, part) => {
    obj[part.type] = part.value;
    return obj;
  }, {});
  console.log(parts)   
  const format = "{year}-{month}-{day} {hour}:{minute}:{second}"
  return format.replace(/\{(.*?)}/g, (x,g)=> parts[g]);
}

export async function updateSubscriber(context: coda.ExecutionContext, subscriberId:string, groups?:string | string[], email?:string, firstName?:string, lastName?:string, fromPartner?:string, 
                                 partyRowId?:string, status?:string, unsubscribeDate?:Date|string, subscribeDate?:Date|string) {
  // try{
    console.log(`subscriberId: ${subscriberId}, groups:${groups}, email:${email}, firstName:${firstName}, lastName:${lastName}, fromPartner:${fromPartner}, 
    partyRowId:${partyRowId}, status:${status}, unsubscribeDate:${unsubscribeDate}, subscribeDate:${subscribeDate}`)
    let body = {}
    if(groups){ body["groups"] = Array.isArray(groups) ? groups : groups.split(',')  }
    if(email){body["email"]= email}
    if(firstName || lastName || fromPartner || partyRowId){
      let fields = {}
      if(firstName) {fields["name"] = firstName}
      if(lastName) {fields["last_name"] = lastName}
      if(fromPartner) {fields["from_partner"] = fromPartner}
      if(partyRowId) {fields["party_row_id"] = partyRowId}
      body["fields"] = fields
    }
    if(status){ 
      body["status"] = status
      if(status === "unsubscribed" && unsubscribeDate){ body["unsubscribed_at"] = unsubscribeDate instanceof Date ? formatTimestamp(unsubscribeDate, context.timezone) : unsubscribeDate}
      if(status === "active" && subscribeDate){ body["subscribed_at"] = subscribeDate instanceof Date ? formatTimestamp(subscribeDate, context.timezone) : subscribeDate}
    }
    console.log(body)

    let response = await context.fetcher.fetch({
      url: `${API_BASE_URL}subscribers/${subscriberId}`,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    
    let result = response.body.data 
    console.log(result)

    return result;
}