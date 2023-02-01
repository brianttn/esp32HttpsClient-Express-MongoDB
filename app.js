const dotenv = require('dotenv').config()       // Include 環境變數package

const dhtConstructor = require('./models/dht11');
const express = require('express');
const cors = require("cors");
const mongoose = require('mongoose');

const app = express();

/* = = = = = =   建立連線到Railway上Deploy的MongoDB   = = = = = = */
const mongodbPwd = process.env.MONGODB_PASSWORD;

(
    async () => {
        try {
            await mongoose.connect(`mongodb://mongo:${mongodbPwd}@containers-us-west-182.railway.app:6718`)
            console.log(`MongoDB is connected!!`)
        } catch (err) {
            console.error("Database connection error!!", err)
        }
    }
)();

/* - - - - - 持續確認(監聽) =>「Railway上Deploy的MongoDB」的連線狀態 - - - - - */
const currDB = mongoose.connection;     // 「目前(current)：已取得連線」的資料庫

currDB.on(
    "connected",
    () => console.log("MongoDB is Online!!")
)

currDB.on(
    "disconnected",
    () => console.log("MongoDB is Offline!!")
)

currDB.on(
    "error",
    err => console.error("MongoDB Error!!", err)
)


/* = = = = = = = = = = = =     Apply Middlewares     = = = = = = = = = = = = */
/*--- Parse 「Content-Type：application/json」的「Request Body」資料 ---*/
app.use(express.json())
/*- Parse 「Content-Type：x-www-form-urlencoded」的「Request Body」資料 -*/
// false：只接受「字串」型式資料
// true：接受「所有」型式資料
app.use(express.urlencoded({ extended: false }))
/* - - - - - - 接受「所有：Origins」的HTTP Request - - - - - - */
app.use(cors())


/* = = = = = = = = = = = =     分頁顯示資料     = = = = = = = = = = = = */
app.set('view engine', 'ejs')       // 設定「EJS」為「templating engine」

const docsPerPage = 10;
let totalDocs;
let lastPageNum;


/* = = = = = = = = = = = =     Web route APIs     = = = = = = = = = = = = */
app.get(
    "/",
    (req, res) => {
        res.send('Real-time temperature and humidity monitoring website');
    }
)

app.get(
    "/data",
    (req, res) => {
        // 計算：目前在MongoDB「Database：sensors」的documents數量
        dhtConstructor.count(
            {},
            (err, count) => {
                totalDocs = count;
                lastPageNum = Math.ceil(totalDocs / docsPerPage);
            }
        );

        let pageNum = req.query.p || 1;   // 接收頁碼
        if (pageNum < 1) {
            pageNum = 1;
        }

        let skipDocs = (pageNum - 1) * docsPerPage;
        if (skipDocs >= totalDocs) {
            skipDocs = 0;
        }

        dhtConstructor.find().select(
            { _id: 0, __v: 0 }      // 將「欄位：_id、__v」從查詢中「剔除」
        ).sort(
            { 'time': -1 }
        ).skip(
            skipDocs
        ).limit(
            docsPerPage
        ).exec(
            (err, docs) => {
                res.render(
                    'index.ejs',
                    /* - - - 傳遞給「view當區域變數」的「物件：屬性值」 - - - */
                    {
                        docs: docs,
                        pageNum: pageNum,
                        lastPageNum: lastPageNum
                    }
                );
            }
        );
    }
);

app.post(
    "/data",
    async (req, res) => {
        let temp = req.body.temp;
        let humid = req.body.humid;

        temp = temp.toFixed(2);     // 取到小數第二位

        // Make sure that both temp and humid have received
        if (temp != undefined && humid != undefined) {
            try {
                const data = new dhtConstructor({ 'temperature': temp, 'humidity': humid });

                await data.save();
                data.show()
                console.log('資料儲存成功!!\n');
                // 在網頁上顯示接收到的溫濕度值
                res.send(`Temperature: ${temp}, Humidity: ${humid}`);
            } catch (err) {
                console.error("資料儲存失敗!!", err)
            }
        } else {
            console.log("資料接收異常!!");
        }
    }
);

/* - - -   輸入：不存在的URL route   - - - */
app.use(
    '*',
    (req, res) => {
        res.status(404);
        res.send('Wrong web route!!');
    }
)


/* = = = = = =   Launch the server and listen on  port   = = = = = = */
const port = process.env.PORT || 3000
const hostname = '0.0.0.0'

app.listen(
    port,
    hostname,
    err => err ? console.log("Server error!!") : console.log(`Server running at http://${hostname}:${port}/`)
)