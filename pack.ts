import * as coda from "@codahq/packs-sdk";
import { CampaignSchema } from "./schemas";
import { SubscribersSchema } from "./schemas";
import { GroupsSchema } from "./schemas";
import { StatsSchema } from "./schemas";

export const pack = coda.newPack();

pack.addNetworkDomain("connect.mailerlite.com");

const API_BASE_URL = "https://connect.mailerlite.com/api/"

// pack.setUserAuthentication({
//   type: coda.AuthenticationType.CustomHeaderToken,
//   instructionsUrl: "https://developers.mailerlite.com/docs/authentication",
//   headerName: 'X-MailerLite-ApiKey',
// });
pack.setUserAuthentication({
  type: coda.AuthenticationType.HeaderBearerToken,
  instructionsUrl: "https://developers.mailerlite.com/docs/authentication",
})

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


pack.addSyncTable({
  name: "Subscribers",
  schema: SubscribersSchema,
  identityName: "Subscribers",
  formula: {
    name: "Subscribers",
    description: "A list of all subscribers",
    parameters: [
      //if I want to add an extra param to filter by customers
      coda.makeParameter({
        type: coda.ParameterType.String,
        name: "Subscribers",
        description: "List of all subscribers",
        optional: true,
        
      }),
    ],

    execute: async function ([name,email,opened_rate,opened], context) {
      let url = `${API_BASE_URL}subscribers?limit=1000`
      let response = await context.fetcher.fetch({
        method: "GET",
        url: url,
      });

      console.log(response)
      let results = response.body;
      console.log(results)

      return {
        result: results
      }


      },
    },
  },
);



pack.addSyncTable({
  name: "Groups",
  schema: GroupsSchema,
  identityName: "Groups",
  formula: {
    name: "Groups",
    description: "A list of all groups",
    parameters: [
    
      coda.makeParameter({
        type: coda.ParameterType.String,
        name: "Subscribers",
        description: "List of all subscribers",
        optional: true,
        
      }),
    ],

    execute: async function ([name,id], context) {
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
      // Update the task in Todoist.
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
