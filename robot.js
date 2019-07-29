/* jshint esversion: 6 */
const fs = require("fs"); // 文件操作模块
const request = require("request"); // 网络请求模块
const moment = require("moment"); // 日期格式化模块
const schedule = require("node-schedule"); // 定时任务模块
const optionProvider = require("./option-provider"); // 提供请求参数模块
const util = require("util"); // 工具类
const querystring = require("querystring"); // URL参数解析模块
const crypto = require("crypto"); // 编解码工具


// TODO: 将各任务抽成继承关系的模块
// TODO: 统一的请求错误日志收集模块
// TODO: 尝试改为markdown，使文本有突出性
// TODO: 修改log逻辑，一旦网络出错则crash
// TODO: 出错逻辑(if success)
// TODO: Promise封装异步任务

schedule.scheduleJob("0 40 10 * * 4", () => { // 每周四11点外卖提醒
    console.log(`start 每周四11点外卖提醒: ${moment().format("YYYY-MM-DD HH:mm:ss")}`);

    let content = fs.readFileSync("./messages/text_takeout.txt").toString();
    let option = optionProvider.newRobotTextOption(content, ["15602386385"]);
    request.post(option, (err, res, body) => {
        logResponse(err, res, body);

        console.log(`end 每周四11点外卖提醒`);
    });
});

schedule.scheduleJob("0 0 10 * * 1", () => { // 每周一10点周报提醒
    console.log(`start 每周一10点周报提醒: ${moment().format("YYYY-MM-DD HH:mm:ss")}`);

    let content = fs.readFileSync("./messages/text_week_report.txt").toString();
    let option = optionProvider.newRobotTextOption(content);
    request.post(option, (err, res, body) => {
        logResponse(err, res, body);

        console.log(`end 每周一10点周报提醒`);
    });
});

schedule.scheduleJob("0 20 9 * * 1-5", () => { // 工作日提醒上班打卡
    console.log(`start 工作日提醒上班打卡: ${moment().format("YYYY-MM-DD HH:mm:ss")}`);

    let content = fs.readFileSync("./messages/text_day_on.txt").toString();
    let option = optionProvider.newRobotTextOption(content, ["@all"]);
    request.post(option, (err, res, body) => {
        logResponse(err, res, body);

        console.log(`end 工作日提醒上班打卡`);
    });
});

schedule.scheduleJob("0 30 21 * * *", () => { // 工作日提醒加班打卡
    console.log(`start 工作日提醒加班打卡: ${moment().format("YYYY-MM-DD HH:mm:ss")}`);

    let content = fs.readFileSync("./messages/text_day_off.txt").toString();
    let option = optionProvider.newRobotTextOption(content, ["@all"]);
    request.post(option, (err, res, body) => {
        logResponse(err, res, body);

        console.log(`end 工作日提醒加班打卡`);
    });
});

const md5Generator = crypto.createHash("md5"); // MD5工具
schedule.scheduleJob("0 0 8 * * 1-5", () => { // 工作日上班天气提醒
    console.log(`start 工作日上班天气提醒: ${moment().format("YYYY-MM-DD HH:mm:ss")}`);

    let option = optionProvider.newWeatherOption();
    request.get(option, (err, res, body) => {
        console.log(`get weather 工作日上班天气提醒`);
        if (!logResponse(err, res, body)) {
            return;
        }

        // 将天气结果转码 & 转为JSON
        let weather = JSON.parse(querystring.unescape(body));

        // 发送文本信息
        let content = fs.readFileSync("./messages/text_morning_weather.txt").toString();
        content = util.format(content, weather.tem, weather.wea, weather.tem1, weather.tem2, weather.air_tips);
        let option = optionProvider.newRobotTextOption(content);
        request.post(option, (err, res, body) => {
            logResponse(err, res, body);

            console.log(`end text 工作日上班天气提醒`);
        });

        // 获取并发送随机图片
        let fileName = `./imgs/${moment().format("YYYY-MM-DD")}.jpg`;
        let stream = fs.createWriteStream(fileName);
        let imgOption = optionProvider.newRandomImageOption();
        request.get(imgOption).pipe(stream);
        stream.on("finish", (data) => {
            let img = fs.readFileSync(fileName);
            let base64 = img.toString("base64");
            let md5 = md5Generator.update(img).digest("hex");
            let imgOption = optionProvider.newRobotImageOption(base64, md5);
            request.post(imgOption, (err, res, body) => {
                logResponse(err, res, body);

                console.log(`end image 工作日上班天气提醒`);
            });
        });
    });
});

function logResponse(err, res, body) {
    let success = false;
    let info = moment().format("YYYY-MM-DD HH:mm:ss");
    if (err) {
        info += `[ERROR] ${err}`;
    } else if (!res || res.statusCode != 200) {
        info += `[WRONG RES] ${res}`;
    } else {
        success = true;
        info += `[BODY] ${body}`;
    }
    info += "\n\n";

    let fd = fs.writeFileSync('./log.txt', info, {
        flag: "a"
    });

    return success;
}
