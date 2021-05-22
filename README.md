# Notion API - get Awwwards votes

Web scrapping scheduled script to save [Awwwards](https://www.awwwards.com/) votes to [Notion app](https://www.notion.so/). Ready to be used on Heroku.
## Installation

Git clone the package to install the script.

## Features
Save in a notion table all votes assignated to a specific page. In addition, these fields are scrapped as well :
- Name (`text`)
- Status (`select`)
- Country (`text`)
- Website (`link`)
- Vote (`Number`)
- Design (`Number`)
- Usability (`Number`)
- Creativity (`Number`)
- Content (`Number`)

## Build with
- Nodejs
- Notion Api (official [@notionhq/client](https://www.npmjs.com/package/@notionhq/client))
- [Puppeteer](https://pptr.dev/)
- [AMQP](https://www.npmjs.com/package/amqplib)

## Usage
1) Using this script need you to have a Notion account. Then, if needed, create a [new Integration](https://developers.notion.com/docs/getting-started). Duplicate this template, enter the awwwards url you want to follow (eg. `https://www.awwwards.com/sites/[SITE]`), save the database id and insert the table in any page you want to display a filtered view (or not).

2) Save Notion API variables (`NOTION_KEY` and `NOTION_DATABASE_ID`) to `.env` file and Heroku. 

2) Modify the Job timer inside `./clock.js` file

```javascript
const JOBS = [{
  name: "Cron process 1",
  message: { "taskName": "getNotes", "queue": "worker-queue" },
  cronTime: "*/50 * * * *",  // config -> https://www.npmjs.com/package/node-cron
  repeat: 1
},
//{... other Job}
];
```

3) You can try the script in local with the following command : `$ npm run start`. If it work, the Notion table should fill up after a few seconds.

4) Then, deploy on heroku (thank to CLI) and don't forget to use the next configs.

## Notion API
Discover [Notion API here](https://developers.notion.com/).

## Heroku
Heroku must be configured to run those script.
- **Variables:**
    - `NOTION_DATABASE_ID`
    - `NOTION_KEY`
- **Buildpack  (settings -> in very order):**
    - `heroku/nodejs` 
    - `https://github.com/jontewks/puppeteer-heroku-buildpack` – [Puppeteer mandatory](https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-puppeteer-on-heroku)
- **Procfile is needed:**
    - `worker: node worker.js`
    - `clock: node clock.js`
- **Dynos : 2 (free) dynos must be started:** 
    - `$ heroku ps:scale worker=1` 
    - `$ heroku ps:scale clock=1`

## Warning concerning Awwwards DOM
Since Puppeteer is base on DOM, it may be broken in future. So, if the script is not able to retrieve some information from awwwards page, it should be because the targeted DOM should be updated.
You can do it in the `./app`file. 
```javascript
return { 
  name: el.querySelector(".info > .rows > .row a").textContent,
  status: el.querySelector(".list-number-awards .tooltip-text").textContent,
  website: el.querySelector(".info > .rows .row:last-child a").textContent,
  country: el.querySelector(".info > .rows .row strong:last-child").textContent,
  note: el.querySelector(".note").textContent,
  design: el.querySelector(".list-circle-notes > .design").dataset.note,
  usability: el.querySelector(".list-circle-notes > .usability").dataset.note,
  creativity: el.querySelector(".list-circle-notes > .creativity").dataset.note,
  content: el.querySelector(".list-circle-notes > .content").dataset.note,
}
```
## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)