// connection à l'api
// 1 - get l'url 
// 2 - scrap la page awwwards
// 2 - loop 
        // vérifier que les notes scrappé ne sont pas déjà enregistré dans la variable (iso notion)
        // si pas entrée dans notion, alors on post nouvelle entrée dans notion
        // on enregistre la nouvelle note dans la variable

const puppeteer = require('puppeteer');
const {Client} = require("@notionhq/client");
const dotenv = require("dotenv");
dotenv.config();

// GLOBALES
// -- notion
const notion = new Client({auth:process.env.NOTION_KEY}),
      database_id = process.env.NOTION_DATABASE_ID;

// -- app
const notations = [],
      databaseId = process.env.NOTION_DATABASE_ID;
let URL = "";


const findModification = async function () {
    const [freshData, oldData] = await Promise.all([getAwwwards(), getNotion()]);
    const newdata = freshData.filter(data => oldData.indexOf(data.name) === -1);
    const request_payload = {
        database_id: database_id, 
    };
    const test = await notion.databases.query(request_payload);

    for (const [key,value] of Object.entries(newdata)){
        await notion.request({
            path:'pages', 
            method:"POST", 
            body:{
                "parent": { "database_id": database_id},
                "properties": {
                    "Name":[{ "text": {"content" :value.name}}],
                    "Status": {"name": value.status},
                    "Country": [{ "text": {"content": value.country || ' '}}],
                    "Website": value.website || ' ' ,
                    "Note Globale": parseFloat(value.note),
                    "Design": parseFloat(value.design),
                    "Usability": parseFloat(value.usability),
                    "Creativity": parseFloat(value.creativity),
                    "Content": parseFloat(value.content),
                }
            }
        })
    }
};

// Get URL function
const getUrl = async function () {
    //get data (title must be the awwwards link)
    const response = await notion.databases.retrieve({ database_id: databaseId }); 
    URL = response.title[0].href;
};

const getNotion = async function () {
    const data = await notion.databases.query({database_id: database_id}); 
    return data.results.map(x => x.properties.Name.title[0].plain_text);
};

// Get data from awwwards
const getAwwwards = async function () {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(URL);
    
    //wait infos
    // const DOM = {
    //     container: "#user_votes",
    //     users: "#user_votes > li",
    //     note: ".note",
    //     name: ".info > .rows > .row a",
    //     country : ".info > .rows .row:last-child strong",
    //     status: ".list-number-awards .tooltip-text",
    //     design: ".list-circle-notes > .design",
    //     usability: ".list-circle-notes > .usability",
    //     creativity: ".list-circle-notes > .creativity",
    //     content: ".list-circle-notes > .content"
    // };

    await page.waitForSelector("#user_votes");

    const votesContent = await page.$$eval("#user_votes > li", els => {
        return els.map((el) => {
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
        })
    });
    await browser.close();
    return votesContent;
};


// (async () => {
//     await getUrl();
//     await findModification().catch(console.error);
// })();
const main = async function () {
    await getUrl();
    await findModification().catch(console.error);
}

module.exports = {
    main: main
}
// Start
// (async ()=>{
//     parseAllProject(await getAllProjects());
// })()