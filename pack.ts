import * as coda from "@codahq/packs-sdk";
import { SubscribersSchema } from "./schemas";
import { GroupsSchema } from "./schemas";
import { Meta } from "./types";
import { getSubscribersForAllGroups, updateSubscriber } from "./helpers";


export const pack = coda.newPack();

pack.addNetworkDomain("connect.mailerlite.com");

export const API_BASE_URL = "https://connect.mailerlite.com/api/"

pack.setUserAuthentication({
  type: coda.AuthenticationType.HeaderBearerToken,
  instructionsUrl: "https://developers.mailerlite.com/docs/authentication",
})


// Subscribers
pack.addSyncTable({
  name: "Subscribers",
  schema: SubscribersSchema,
  identityName: "Subscribers",
  formula: {
    name: "Subscribers",
    description: "A list of all subscribers",
    parameters: [],

    execute: async function ([], context) {
      let subscriberGroups = await getSubscribersForAllGroups(context)
      const limit = 1000
      let {prev_cursor, next_cursor} = context.sync.continuation ?? {}
      let param = {limit}
      if(next_cursor) {param['cursor'] = next_cursor}
      let url = coda.withQueryParams(`${API_BASE_URL}subscribers`, param)
      console.log(`url: ${url}`)
      let response = await context.fetcher.fetch({
        method: "GET",
        url: url,
      });

      // TODO : Get a list of groups, each with a list of subscribers
      // use this list to lookup the groups for a subscriber and add an array of GroupIds to the subscriber
      let results = response.body.data;
      console.log(`results count: ${results.length}`)
      let meta = response.body.meta as Meta
      for (let result of results){
        result.firstName = result.fields?.name
        result.lastName = result.fields?.last_name
        result.fromPartner = result.fields?.from_partner
        result.partyRowId = result.fields?.party_row_id
        result.opened_rate =  result.opened_rate/100
        result.clicked_rate = result.clicked_rate/100
        result.groups = subscriberGroups[result.id]
        result.newEmail = null
        result.newFirstName = null
        result.newLastName = null
        result.newFromPartner = null
        result.newGroups = null
        result.newStatus = null
        result.newSubscribeAt = null
        result.newUnsubscribeAt = null

        // result.newGroups = grps ? grps.map(grp => grp.id).join(",") : "" 
        // result.newStatus = result.status
        // result.new_subscribe_at = result.subscribed_at
        // result.new_unsubscribe_at = result.unsubscribed_at
      }

      let continuation
      if(meta.next_cursor){
        // There are more results. Go back and get them
        continuation = {prev_cursor: meta.prev_cursor, 
                        next_cursor: meta.next_cursor}
        
        console.log(`continuation = ${JSON.stringify(continuation, null, 2)}`)
      }

      return {
        result: results,
        continuation
      }

      },
    executeUpdate:async function(args, updates, context){
      let update = updates[0];  // Only one row at a time, by default.
      let {id, newEmail, newFirstName, newLastName, newFromPartner, partyRowId, newGroups, newStatus, newUnsubscribedAt, newSubscribedAt}= update.newValue;

      console.log(JSON.stringify(update, null, 2))
      let params = []
      params.push( update.updatedFields.includes("newGroups") ? newGroups : undefined)
      params.push( update.updatedFields.includes("newEmail") ? newEmail : undefined)
      params.push( update.updatedFields.includes("newFirstName")  ? newFirstName : undefined)
      params.push( update.updatedFields.includes("newLastName") ? newLastName : undefined)
      params.push( update.updatedFields.includes("newFromPartner") ? newFromPartner : undefined)
      params.push( update.updatedFields.includes("partyRowId") ? partyRowId : undefined)
      if( update.updatedFields.includes("newStatus") ){ 
        params.push( newStatus )
        params.push(update.updatedFields.includes("newUnsubscribedAt") ? newUnsubscribedAt : undefined) 
        params.push(update.updatedFields.includes("newSubscribedAt") ? newSubscribedAt : undefined) 
      }

      console.log(params)

      try{
        let result = await updateSubscriber(context, id, ...params )

        result.firstName = result.fields?.name
        result.lastName = result.fields?.last_name
        result.fromPartner = result.fields?.from_partner
        result.partyRowId = result.fields?.party_row_id
        result.opened_rate =  result.opened_rate/100
        result.clicked_rate = result.clicked_rate/100
        result.newEmail = null
        result.newFirstName = null
        result.newLastName = null
        result.newFromPartner = null
        result.newGroups = null
        result.newStatus = null
        result.newSubscribeAt = null
        result.newUnsubscribeAt = null

        return{ result:[result]}

      } catch(error){
          // If the request failed because the server returned a 300+ status code.
          console.log(error)
          if (coda.StatusCodeError.isStatusCodeError(error)) {
            // Cast the error as a StatusCodeError, for better intellisense.
            let statusError = error as coda.StatusCodeError;
            // If the API returned an error message in the body, show it to the user.
            console.log(statusError)
            let message = statusError.body?.message;
            if (message) {
              throw new coda.UserVisibleError(message);
            }
          }
          // The request failed for some other reason. Re-throw the error so that it
          // bubbles up.
          throw error;
      }
    },
    },
});

// Groups
pack.addSyncTable({
  name: "Groups",
  schema: GroupsSchema,
  identityName: "Groups",
  formula: {
    name: "Groups",
    description: "A list of all groups",
    parameters: [],

    execute: async function ([], context) {
      let url = `${API_BASE_URL}groups`
      let response = await context.fetcher.fetch({
        method: "GET",
        url: url,
      });

      let results = response.body.data;

      for (let result of results){
        result.openRate = result.open_rate.float
        result.openRatePct = result.open_rate.string
        result.clickRate = result.click_rate.float
        result.clickRatePct = result.click_rate.string
      }

      return {
        result: results
      }

    },
    executeUpdate: async function (args, updates, context) {
      let update = updates[0];  // Only one row at a time, by default.
      let {id, name}= update.newValue;
      let response = await context.fetcher.fetch({
        method: "PUT",
        url: `${API_BASE_URL}groups/${id}`,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({name:name}),
      });

      let result = response.body.data;

      result.openRate = result.open_rate.float
      result.openRatePct = result.open_rate.string
      result.clickRate = result.click_rate.float
      result.clickRatePct = result.click_rate.string
      
      // Return the results.
      return {
        result: [result]
      };
    }
    },
  },
);

// //Campaigns
// pack.addSyncTable({
//   name: "Campaigns",
//   schema: CampaignSchema,
//   identityName: "Campaigns",
//   formula: {
//     name: "Campaigns",
//     description: "A list of all campaigns",
//     parameters: [
//       //if I want to add an extra param to filter by customers
//       coda.makeParameter({
//         type: coda.ParameterType.String,
//         name: "Partners",
//         description: "List of all Partners",
//         optional: true,
        
//       }),
//     ],

//     execute: async function ([name,subject,date_send,status,count,rate], context) {

//       // let url = "https://api.mailerlite.com/api/v2/campaigns";
//       let url = `${API_BASE_URL}campaigns`
//       let response = await context.fetcher.fetch({
//         method: "GET",
//         url: url,
//       });

    
//       let results = response.body;


//       for (let result of results){
//         //restructure the Json to match what I want in Coda
//         result.count = result.opened.count
//       };

//       for (let result of results){
//         //restructure the Json to match what I want in Coda
//         result.rate = result.opened.rate/100
//       };

//       for (let result of results){
//         //restructure the Json to match what I want in Coda
//         result.click_rate = result.clicked.rate/100
//       };

//       return {
//         result: results
//       }


//       },
//     },
//   },
// );

// //Stats_starts
// pack.addSyncTable({
//   name: "Stats",
//   schema: StatsSchema,
//   identityName: "Stats",

//   formula: {
//     name: "Stats",
//     description: "A list of your account stats",
//     parameters: [
//       coda.makeParameter({
//         type: coda.ParameterType.Number,
//         name: "Stats",
//         description: "List of all subscribers",
//         optional: true,
        
//       }),
//     ],
//     execute: async function ([stats], context) {

//       // let url = "https://api.mailerlite.com/api/v2/stats";
//       let url = `${API_BASE_URL}stats`
//       let response = await context.fetcher.fetch({
//         method: "GET",
//         url: url,
//       });
//       let results = [response.body]
//       return {result: results}
//       },
//     },
//   },
// );
// //stats_end

/** FORMULAS */
// Add a new subscriber
pack.addFormula({
  name: "AddSubscriber",
  description: "Add a new subscriber.",
  parameters: [
    coda.makeParameter ({
      type: coda.ParameterType.String,
      name: "email",
      description: "the email",
      optional: false
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "firstName",
      description: "First name for the subscriber.",
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "lastName",
      description: "Last name for the subscriber.",
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "fromPartner",
      description: "The formal partner assocaited with the subscriber.",
    }),
    coda.makeParameter({
      type: coda.ParameterType.SparseStringArray,
      name: "groups",
      description: "Groups to add the scubscriber to"
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "partyRowId",
      description: "The row id for the party"
    }),
  ],
  resultType: coda.ValueType.String,
  isAction: true,

  execute: async function ([email, firstName, lastName, fromPartner, groups, partyRowId], context) {
    try{
      let response = await context.fetcher.fetch({
        url: `${API_BASE_URL}subscribers`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          "fields": {
            "name": firstName,
            "last_name": lastName,
            "from_partner": fromPartner,
            "party_row_id":partyRowId
          },
          groups: groups ? groups : [],
        }),
      });
      
      let result = response.body.data 
      console.log(result)

      return result;
    } catch(error){
      // If the request failed because the server returned a 300+ status code.
      console.log(error)
      if (coda.StatusCodeError.isStatusCodeError(error)) {
        // Cast the error as a StatusCodeError, for better intellisense.
        let statusError = error as coda.StatusCodeError;
        // If the API returned an error message in the body, show it to the user.
        let message = statusError.body?.message;
        if (message) {
          message = JSON.stringify(statusError.body?.errors, null, 2)
          throw new coda.UserVisibleError(message);
        }
      }
      // The request failed for some other reason. Re-throw the error so that it
      // bubbles up.
      throw error;
    }
  },
});

// Update an existing subscriber
pack.addFormula({
  name: "UpdateSubscriber",
  description: "Update an existing subscriber.",
  parameters: [
    coda.makeParameter ({
      type: coda.ParameterType.String,
      name: "subscriberId",
      description: "The id of the scubscriber to remove from  the group",
      optional:false
    }),
    coda.makeParameter({
      type: coda.ParameterType.StringArray,
      name: "groups",
      description: "An array of ids of groups the subscriber will belong to. The subscriber will be remvoed from any groups they are currently in that are not in the lizt.",
      optional:true
    }),
    coda.makeParameter ({
      type: coda.ParameterType.String,
      name: "email",
      description: "The email to update for the subscriber.  Thie can only be changed once a month for a given subscriber.",
      optional: true
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "firstName",
      description: "First name for the subscriber.",
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "lastName",
      description: "Last name for the subscriber.",
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "fromPartner",
      description: "The formal partner assocaited with the subscriber.",
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "partyRowId",
      description: "The row id for the party",
      optional: true
    }),
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "status",
      description: "The status of the subscriber.",
      autocomplete: ["active", "unsubscribed", "unconfirmed", "bounced", "junk"],
      optional: true,
    }),
    coda.makeParameter({
      type: coda.ParameterType.Date,
      name: "unsubscribedDate",
      description: "The date and time the subcriber unsubscribed. Must be specified when the status is unsubscribe",
      optional: true
    }),
    coda.makeParameter({
      type: coda.ParameterType.Date,
      name: "subscribedDate",
      description: "The date and time the subcriber subscribed. Used when the status is active",
      optional: true
    })
  ],
  resultType: coda.ValueType.String,
  isAction: true,

  execute: async function ([subscriberId, groups, email, firstName, lastName, fromPartner, partyRowId, status, unsubscribeDate, subscribeDate], context) {
    return updateSubscriber(context, subscriberId, groups, email, firstName, lastName, fromPartner, partyRowId, status, unsubscribeDate, subscribeDate);
  },
});

//add an existing subscriber to a group
pack.addFormula({
  name: "AddSubscriberToGroup",
  description: "Add a new subscriber to a specific group",
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "groupId",
      description: "The id of the group to add the subscriber to.",
    }),
    coda.makeParameter ({
      type: coda.ParameterType.String,
      name: "subscriberId",
      description: "The id of the scubscriber to add to the group",
    }),
  ],
  resultType: coda.ValueType.Number,
  isAction: true,

  execute: async function ( [groupId, subscriberId], context) {
    try{
      let response = await context.fetcher.fetch({
        url: `${API_BASE_URL}subscribers/${subscriberId}/groups/${groupId}`,
        method: "POST"
      });
      
      return response.status
    } catch(error){
      // If the request failed because the server returned a 300+ status code.
      console.log(error)
      
      if (coda.StatusCodeError.isStatusCodeError(error)) {
        // Cast the error as a StatusCodeError, for better intellisense.
        let statusError = error as coda.StatusCodeError;
        // If the API returned an error message in the body, show it to the user.
        if(statusError.statusCode === 404){
          throw new coda.UserVisibleError(`Either the Group Id [${groupId}] and/or the Subscriber Id [${subscriberId}] is not valid`)
        }
        let message = statusError.body?.message;
        if (message) {
          message = JSON.stringify(statusError.body?.errors, null, 2)
          throw new coda.UserVisibleError(message);
        }
      }
      // The request failed for some other reason. Re-throw the error so that it
      // bubbles up.
      throw error;
    }
  },
});

//remove a subscriber to a group
pack.addFormula({
  name: "RemoveSubscriberFromGroup",
  description: "Remove a subscriber from a specific group",
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "groupId",
      description: "The id of the group to remove the subscriber from.",
    }),
    coda.makeParameter ({
      type: coda.ParameterType.String,
      name: "subscriberId",
      description: "The id of the scubscriber to remove from  the group",
    }),
  ],
  resultType: coda.ValueType.Number,
  isAction: true,

  execute: async function ( [groupId, subscriberId], context) {
    try{
      let response = await context.fetcher.fetch({
        url: `${API_BASE_URL}subscribers/${subscriberId}/groups/${groupId}`,
        method: "DELETE"
      });
      
      return response.status
    } catch(error){
      // If the request failed because the server returned a 300+ status code.
      console.log(error)
      
      if (coda.StatusCodeError.isStatusCodeError(error)) {
        // Cast the error as a StatusCodeError, for better intellisense.
        let statusError = error as coda.StatusCodeError;
        // If the API returned an error message in the body, show it to the user.
        if(statusError.statusCode === 404){
          throw new coda.UserVisibleError(`Either the Group Id [${groupId}] and/or the Subscriber Id [${subscriberId}] is not valid`)
        }
        let message = statusError.body?.message;
        if (message) {
          message = JSON.stringify(statusError.body?.errors, null, 2)
          throw new coda.UserVisibleError(message);
        }
      }
      // The request failed for some other reason. Re-throw the error so that it
      // bubbles up.
      throw error;
    }

  },
});

// Delete a subscriber
pack.addFormula({
  name: "DeleteSubscriber",
  description: "Delete a subscriber. Removes the subscriber from the account but keeps their info incase they re-subscribe.  Use ForgetSubscriber to remove and delete their info",
  parameters: [
    coda.makeParameter ({
      type: coda.ParameterType.String,
      name: "subscriberId",
      description: "The Id of the scubscriber to delete",
      optional: false
    }),
    
  ],
  resultType: coda.ValueType.String,
  isAction: true,

  execute: async function ([subscriberId], context) {
    try{
      let response = await context.fetcher.fetch({
        url: `${API_BASE_URL}subscribers/${subscriberId}`,
        method: "DELETE",
      });
      
      let result = response.status === 204 ? "Ok" : "ok"  
      console.log(result)

      return result;
    } catch(error){
      // If the request failed because the server returned a 300+ status code.
      console.log(error)
      
      if (coda.StatusCodeError.isStatusCodeError(error)) {
        // Cast the error as a StatusCodeError, for better intellisense.
        let statusError = error as coda.StatusCodeError;
        // If the API returned an error message in the body, show it to the user.
        if(statusError.statusCode === 404){
          throw new coda.UserVisibleError(`The Subscriber Id [${subscriberId}] is not valid`)
        }
        let message = statusError.body?.message;
        if (message) {
          message = JSON.stringify(statusError.body?.errors, null, 2)
          throw new coda.UserVisibleError(message);
        }
      }
      // The request failed for some other reason. Re-throw the error so that it
      // bubbles up.
      throw error;
    }
  },
});

// Forget a subscriber
pack.addFormula({
  name: "ForgetSubscriber",
  description: "Delete a subscriber in a GDPR-complaint manner. Removes the subscriber from the account and removes their info after 30 days",
  parameters: [
    coda.makeParameter ({
      type: coda.ParameterType.String,
      name: "subscriberId",
      description: "The Id of the scubscriber to delete",
      optional: false
    }),
    
  ],
  resultType: coda.ValueType.String,
  isAction: true,

  execute: async function ([subscriberId], context) {
    try{
      let response = await context.fetcher.fetch({
        url: `${API_BASE_URL}subscribers/${subscriberId}/forget`,
        method: "POST",
      });
      
      console.log(response)
      let result = response.body?.message

      return result;
    } catch(error){
      // If the request failed because the server returned a 300+ status code.
      console.log(error)
      
      if (coda.StatusCodeError.isStatusCodeError(error)) {
        // Cast the error as a StatusCodeError, for better intellisense.
        let statusError = error as coda.StatusCodeError;
        // If the API returned an error message in the body, show it to the user.
        if(statusError.statusCode === 404){
          throw new coda.UserVisibleError(`The Subscriber Id [${subscriberId}] is not valid`)
        }
        let message = statusError.body?.message;
        if (message) {
          message = JSON.stringify(statusError.body?.errors, null, 2)
          throw new coda.UserVisibleError(message);
        }
      }
      // The request failed for some other reason. Re-throw the error so that it
      // bubbles up.
      throw error;
    }
  },
});

// For testing
// pack.addFormula({
//   name:"subscribersWithGroups",
//   description: "testing Get subscribers",
//   parameters:[],
//   resultType: coda.ValueType.String,
//   isAction:true,
//   execute: async function ([], context) {
//     let response = await getSubscribersForAllGroups(context)
    
//     return JSON.stringify(response);
//   }
// })

