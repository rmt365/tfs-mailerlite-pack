import * as coda from "@codahq/packs-sdk";

export const pack = coda.newPack();

pack.addNetworkDomain("api.mailerlite.com");

pack.setUserAuthentication({
  type: coda.AuthenticationType.CustomHeaderToken,
  instructionsUrl: "https://developers.mailerlite.com/docs/authentication",
  headerName: 'X-MailerLite-ApiKey',


});

const CampaignSchema = coda.makeObjectSchema({
  
  properties: {
    name: {
      description: "Name",
      type: coda.ValueType.String,
      required: true,
    },
    date_send: {
      description: "date_send",
      type: coda.ValueType.String,
      required: true,
    },

    subject: {
      description: "Subject",
      type: coda.ValueType.String,
    },

    status: {
      description: "Status",
      type: coda.ValueType.String,
    
    },

    count: {
      description: "Count",
      type: coda.ValueType.Number
    },

    rate: {
      description: "Open rate",
      type: coda.ValueType.Number,
      codaType: coda.ValueHintType.Percent,
    },

    total_recipients: {
      description: "Total recipients",
      type: coda.ValueType.Number,
      required: true,

    },

    click_rate: {
      description: "Click rate",
      type: coda.ValueType.Number,
      codaType: coda.ValueHintType.Percent,
      required: true,

    },


  },
  displayProperty: "name",
  idProperty: "name",
  featuredProperties: ["name","subject","date_send","status","rate"]
  ,
});

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

  
      let url = "https://api.mailerlite.com/api/v2/campaigns";
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

const SubscribersSchema = coda.makeObjectSchema({
  
  properties: {
    name: {
      description: "Name",
      type: coda.ValueType.String,
      required: true,
    },
    id: {
      description: "id",
      type: coda.ValueType.Number
    },
    email: {
      description: "email",
      type: coda.ValueType.String,
      required: true,
    },

    sent: {
      description: "sent",
      type: coda.ValueType.Number,
    },

    opened: {
      description: "opened",
      type: coda.ValueType.Number,
    
    },

    opened_rate: {
      description: "Count",
      type: coda.ValueType.Number,
      codaType: coda.ValueHintType.Percent,
    },

    clicked_rate: {
      description: "clicked rate",
      type: coda.ValueType.Number,
      codaType: coda.ValueHintType.Percent,
    },

    clicked: {
      description: "clicked",
      type: coda.ValueType.Number,
      required: true,

    },

    type: {
      description: "type",
      type: coda.ValueType.String,
      required: true,

    },

     date_created: {
      description: "type",
      type: coda.ValueType.String,
      codaType: coda.ValueHintType.Date,
      required: true,

    },


  },
  displayProperty: "email",
  idProperty: "email",
  featuredProperties: ["name","email","opened_rate","date_created"]
  ,
});

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

  
      let url = "https://api.mailerlite.com/api/v2/subscribers?limit=5000";
      let response = await context.fetcher.fetch({
        method: "GET",
        url: url,
      });

    
      let results = response.body;


      return {
        result: results
      }


      },
    },
  },
);

const GroupsSchema = coda.makeObjectSchema({
  
  properties: {
    name: {
      description: "Name",
      type: coda.ValueType.String,
      required: true,
    },
    id: {
      description: "id",
      type: coda.ValueType.Number
    },
    total: {
      description: "email",
      type: coda.ValueType.Number,
      required: true,
    },

    active: {
      description: "sent",
      type: coda.ValueType.Number,
    },

    unsubscribed: {
      description: "opened",
      type: coda.ValueType.Number,
    
    },

    bounced: {
      description: "Count",
      type: coda.ValueType.Number,
    
    },

    sent: {
      description: "clicked rate",
      type: coda.ValueType.Number,
    },

    opened: {
      description: "clicked",
      type: coda.ValueType.Number,
      required: true,

    },

    clicked: {
      description: "type",
      type: coda.ValueType.Number,
      required: true,

    },

     date_created: {
      description: "type",
      type: coda.ValueType.String,
      codaType: coda.ValueHintType.Date,
      required: true,

    },


  },
  displayProperty: "name",
  idProperty: "name",
  featuredProperties: ["name","id","total","date_created"]
  ,
});

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

  
      let url = "https://api.mailerlite.com/api/v2/groups";
      let response = await context.fetcher.fetch({
        method: "GET",
        url: url,
      });

    
      let results = response.body;


      return {
        result: results
      }


      },
    },
  },
);
  
//Stats_starts
const StatsSchema = coda.makeObjectSchema({
  
  properties: {
    subscribed: {
      description: "Suscribed",
      type: coda.ValueType.Number,
      required: true,
      fromKey: "subscribed"
    },
    unsubscribed: {
      description: "Unsubscribed",
      type: coda.ValueType.Number,
      fromKey: "unsubscribed"
    },
    campaigns: {
      description: "Campaigns",
      type: coda.ValueType.Number,
      required: true,
      fromKey: "campaigns"
    },

    sent_emails: {
      description: "Sent Emails",
      type: coda.ValueType.Number,
      fromKey: "sent_emails"
    },

    open_rate: {
      description: "Open Rate",
      type: coda.ValueType.Number,
      fromKey: "open_rate",
      codaType: coda.ValueHintType.Percent,
    
    },

    click_rate: {
      description: "Click Rate",
      type: coda.ValueType.Number,
      fromKey: "click_rate",
      codaType: coda.ValueHintType.Percent,
      
    },

    bounce_rate: {
      description: "Bounce Rate",
      type: coda.ValueType.Number,
      fromKey: "bounce_rate",
      codaType: coda.ValueHintType.Percent,
      
    },


  },
  displayProperty: "Subscribed",
  idProperty: "Campaigns",
  featuredProperties: ["Subscribed","Unsubscribed","Campaigns"]
  
});

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

      let url = "https://api.mailerlite.com/api/v2/stats";
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
      url: "https://api.mailerlite.com/api/v2/subscribers",
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
      console.log("https://api.mailerlite.com/api/v2/groups/"+Group_ID+"/subscribers")
      let response = await context.fetcher.fetch({
      url: "https://api.mailerlite.com/api/v2/groups/"+Group_ID+"/subscribers",
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
