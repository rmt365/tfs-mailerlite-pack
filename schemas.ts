import * as coda from "@codahq/packs-sdk";

export const CampaignSchema = coda.makeObjectSchema({
  
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
  
export const SubscribersSchema = coda.makeObjectSchema({
  
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

export const GroupsSchema = coda.makeObjectSchema({
        /** 
     * "id": "1",
      "name": "dummy group",
      "active_count": 0,
      "sent_count": 0,
      "opens_count": 0,
      "open_rate": {
        "float": 0,
        "string": "0%"
      },
      "clicks_count": 0,
      "click_rate": {
        "float": 0,
        "string": "0%"
      },
      "unsubscribed_count": 0,
      "unconfirmed_count": 0,
      "bounced_count": 0,
      "junk_count": 0,
      "created_at"
      */

    properties:{
        id: {
            description: "Id",
            type: coda.ValueType.Number,
            required: true,
            fromKey:"id"
        },
        name: {
            description: "Name",
            type: coda.ValueType.String,
            required: true,
            fromKey:"name"
        },
        active:{
            description:"No of active subscribers in the group",
            type:coda.ValueType.Number,
            fromKey:"active_count"
        },
        emailsSent:{
            description:"Total number of emails sent to the group",
            type:coda.ValueType.Number,
            fromKey:"sent_count"
        },
        emailsOpened:{
            description:"Total number of emails opened by the group",
            type:coda.ValueType.Number,
            fromKey:"opens_count"
        },
        openRate:{
            description:"Open rate for the group",
            type:coda.ValueType.Number,
            fromKey:"open_rate.float"
        },
        openRatePct:{
            description:"Open rate percentage for the group",
            type:coda.ValueType.String,
            fromKey:"open_rate.string"
        },
        emailsClicked:{
            description:"Total number of clicks in emails the group",
            type:coda.ValueType.Number,
            fromKey:"clicks_count"
        },
        clickRate:{
            description:"Click rate for the group",
            type:coda.ValueType.Number,
            fromKey:"click_rate.float"
        },
        clickRatePct:{
            description:"Click rate percentage for the group",
            type:coda.ValueType.String,
            fromKey:"click_rate.string"
        },
        unsubscribed:{
            description:"Total number of subscribers that have unsubscribed from the group",
            type:coda.ValueType.Number,
            fromKey:"unsubscribed_count"
        },
        unconfirmed:{
            description:"Total number of subscribers that have confirmed in the group",
            type:coda.ValueType.Number,
            fromKey:"unconfirmed_count"
        },
        bounced:{
            description:"Total number of subscribers in the group whose emails have bounced",
            type:coda.ValueType.Number,
            fromKey:"bounced_count"
        },
        junk:{
            description:"Total number of junk subscribers in the group",
            type:coda.ValueType.Number,
            fromKey:"junk_count"
        },
        createdAt: {
            description: "The date and time the group was created",
            type: coda.ValueType.String,
            codaType: coda.ValueHintType.Date,
            required: true,
            fromKey:"created_at"
          },
    },
    displayProperty: "name",
    idProperty: "id",
    featuredProperties:["name","id", "active", "createdAt"]
})

export const StatsSchema = coda.makeObjectSchema({
  
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

/*
  const GroupsSchemaOLD = coda.makeObjectSchema({
  
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
        description: "Total",
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
*/

