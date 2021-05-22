const puppeteer = require('puppeteer');
const {Client} = require("@notionhq/client");
const dotenv = require("dotenv");

// ENV CONFIG
dotenv.config();

// GLOBALES
const notion = new Client({auth:process.env.NOTION_KEY}),
      database_id = process.env.NOTION_DATABASE_ID;

// FUNCTIONS
const findModification = async url => {
    // Get notes from awwards & from Notion (already saved)
    const [freshData, oldData] = await Promise.all([getAwwwards(url), getNotion()]);

    // Make the diff (from name property -> unique in awwwards)
    const newdata = freshData.filter(data => oldData.indexOf(data.name) === -1);

    // Post data to Notion
    for (const [key,value] of Object.entries(newdata)){
        await notion.request({
            path:'pages', 
            method:"POST", 
            body:{
                "parent": { "database_id": database_id},
                "properties": {
                    "Name":[{ "text": {"content" :value.name}}],
                    "Status": {"name": value.status},
                    "Country": [{ "text": {"content": value.country !== value.name ? value.country : ' '}}],
                    "Website": value.website || ' ' ,
                    "Vote": parseFloat(value.note),
                    "Design": parseInt(value.design,10),
                    "Usability": parseInt(value.usability,10),
                    "Creativity": parseInt(value.creativity,10),
                    "Content": parseInt(value.content,10),
                }
            }
        })
    }
};

// Get URL function
const getUrl = async () => {
    //get data (title must be the awwwards link)
    const response = await notion.databases.retrieve({ database_id: database_id }); 
    return response.title[0].href;
};

// Get Notion saved data (filtered -> Name)
const getNotion = async () => {
    const response = await notion.databases.query({database_id: database_id}); 
    return response.results.map(data => data.properties.Name.title[0].plain_text);
};

// Get data from awwwards
const getAwwwards = async url => {
    // Start browser (https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-puppeteer-on-heroku)
    const browser = await puppeteer.launch({args: ['--no-sandbox']}); //args:['--no-sandbox'] -> for Heroku
    const page = await browser.newPage();
    await page.goto(url);
    
    // Wait for vote display
    await page.waitForSelector("#user_votes");

    // Scrap data from Awwwards
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

    // Close and return scrapped results
    await browser.close();
    return votesContent;
};

// Main Function
const main = async () => {
    const awardsUrl = await getUrl().catch(console.error);
    await findModification(awardsUrl).catch(console.error);
}

module.exports = {
    main: main
}