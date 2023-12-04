import * as coda from "@codahq/packs-sdk";
import { CampaignSchema } from "./schemas";
import { SubscribersSchema } from "./schemas";
import { GroupsSchema } from "./schemas";
import { StatsSchema } from "./schemas";
import { Meta } from "./types";
import { getSubscribersForAllGroups } from "./helpers";

export const pack = coda.newPack();

pack.addNetworkDomain("connect.mailerlite.com");

export const API_BASE_URL = "https://connect.mailerlite.com/api/"

// pack.setUserAuthentication({
//   type: coda.AuthenticationType.CustomHeaderToken,
//   instructionsUrl: "https://developers.mailerlite.com/docs/authentication",
//   headerName: 'X-MailerLite-ApiKey',
// });
pack.setUserAuthentication({
  type: coda.AuthenticationType.HeaderBearerToken,
  instructionsUrl: "https://developers.mailerlite.com/docs/authentication",
})

//Campaigns
pack.addSyncTable({
  name: "Campaigns",
  schema: CampaignSchema,
  identityName: "Campaigns",
  formula: {
    name: "Campaigns",
    description: "A list of all campaigns",
    parameters: [
      //if I want to add an extra param to filter by customers
      coda.makeParameter({
        type: coda.ParameterType.String,
        name: "Partners",
        description: "List of all Partners",
        optional: true,
        
      }),
    ],

    execute: async function ([name,subject,date_send,status,count,rate], context) {

      // let url = "https://api.mailerlite.com/api/v2/campaigns";
      let url = `${API_BASE_URL}campaigns`
      let response = await context.fetcher.fetch({
        method: "GET",
        url: url,
      });

    
      let results = response.body;


      for (let result of results){
        //restructure the Json to match what I want in Coda
        result.count = result.opened.count
      };

      for (let result of results){
        //restructure the Json to match what I want in Coda
        result.rate = result.opened.rate/100
      };

      for (let result of results){
        //restructure the Json to match what I want in Coda
        result.click_rate = result.clicked.rate/100
      };

      return {
        result: results
      }


      },
    },
  },
);

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
        result.opened_rate =  result.opened_rate/100
        result.clicked_rate = result.clicked_rate/100
        result.groups = subscriberGroups[result.id]
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
      let {id, email, firstName, lastName}= update.newValue;
      /**email	string	
       * fields	object
       * groups	array
      */
      let fields = {}
      if( update.updatedFields.includes("firstName") || update.updatedFields.includes("name")){fields['name']=firstName}
      if( update.updatedFields.includes("lastName") || update.updatedFields.includes("last_name")){fields['last_name']=lastName}

      console.log(fields)

      try{
        let response = await context.fetcher.fetch({
          method: "PUT",
          url: `${API_BASE_URL}subscribers/${id}`,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({email, 
                                fields}),
        });

        let result = response.body.data;

        result.firstName = result.fields?.name
        result.lastName = result.fields?.last_name
        result.opened_rate =  result.opened_rate/100
        result.clicked_rate = result.clicked_rate/100
      
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
    }
    },
  },
);


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
  
//Stats_starts
pack.addSyncTable({
  name: "Stats",
  schema: StatsSchema,
  identityName: "Stats",

  formula: {
    name: "Stats",
    description: "A list of your account stats",
    parameters: [
      coda.makeParameter({
        type: coda.ParameterType.Number,
        name: "Stats",
        description: "List of all subscribers",
        optional: true,
        
      }),
    ],
    execute: async function ([stats], context) {

      // let url = "https://api.mailerlite.com/api/v2/stats";
      let url = `${API_BASE_URL}stats`
      let response = await context.fetcher.fetch({
        method: "GET",
        url: url,
      });
      let results = [response.body]
      return {result: results}
      },
    },
  },
);
//stats_end

pack.addFormula({
  name: "AddSubscriber",
  description: "Add a new subscriber.",
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "name",
      description: "Add a new subscriber.",
    }),
    coda.makeParameter ({
      type: coda.ParameterType.String,
      name: "email",
      description: "the email",
      optional: false
    })
    
  ],
  resultType: coda.ValueType.String,
  isAction: true,

  execute: async function ([name,email], context) {
    let response = await context.fetcher.fetch({
      // url: "https://api.mailerlite.com/api/v2/subscribers",
      url: `${API_BASE_URL}subscribers`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "email": email,
        "name": name,
      }),
    });
    
    return "Ok";
  },
});

//add subscriber to a group
pack.addFormula({
  name: "AddSubscriberToGroup",
  description: "Add a new subscriber to a specific group",
  parameters: [
    coda.makeParameter({
      type: coda.ParameterType.String,
      name: "Group_ID",
      description: "Group ID.",
    
    }),
    coda.makeParameter ({
      type: coda.ParameterType.String,
      name: "email",
      description: "the email",
      
    }),
    coda.makeParameter ({
      type: coda.ParameterType.String,
      name: "name",
      description: "First name",
      
    })
    
  ],
  resultType: coda.ValueType.String,
  isAction: true,

  execute: async function ([Group_ID,email,name], context) {
      // console.log("https://api.mailerlite.com/api/v2/groups/"+Group_ID+"/subscribers")
      let response = await context.fetcher.fetch({
      // url: "https://api.mailerlite.com/api/v2/groups/"+Group_ID+"/subscribers",
      url: `${API_BASE_URL}groups/${Group_ID}/subscribers`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "email": email,
        "name": name,
      }),
    });
    
    return "Ok";
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

