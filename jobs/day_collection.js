/* jshint esversion: 6 */
const fs = require("fs");
const path = require("path");
const util = require("util");
const crypto = require("crypto");
const moment = require("moment");
const request = require("request");
const imagemin = require("imagemin");
const querystring = require("querystring");
const imageminPng = require("imagemin-pngquant");
const imageminJpeg = require("imagemin-mozjpeg");
const logger = require("../logger");
const optionUtil = require("../option_util");

const TAG = "每日聚合信息";

const MOST_RETRY_TIME = 2;

const INFO_WEATHER = "天气请求";
const WEATHER_MESSAGE_FILE = path.resolve(__dirname, "../messages/markdown_weather.md"); // 天气消息文本
const WEATHER_FAIL_MESSAGE = "**天气请求失败，请查看日志**\n";

const INFO_NEWS = "网易新闻请求";
const NEWS_FAIL_MESSAGE = "**网易新闻请求失败，请查看日志**\n";
const NEWS_COUNT = 10;

const INFO_CURRENT_NEWS = "Current新闻请求";
const CURRENT_NEWS_FAIL_MESSAGE = "**Current新闻请求失败，请查看日志**\n";
const CURRENT_NEWS_COUNT = 10;

const INFO_IMAGE = "图片请求";
const IMAGE_FAIL_MESSAGE = "**图片请求失败，请查看日志**\n";
const IMAGE_MIN_FAIL_MESSAGE = "**图片压缩失败，请查看日志**\n";

const INFO_POST_MARKDOWN = "发送Markdown消息";
const INFO_POST_IMAGE = "发送图片消息";

exports.rule = "0 0 8 * * *";

exports.task = () => {
    let promiseWeather = new Promise((resolve, reject) => { // 请求天气数据
        let weatherOption = optionUtil.newWeatherOption();
        requestWithRetry(weatherOption, INFO_WEATHER, (result) => {
            if (!result) {
                resolve(WEATHER_FAIL_MESSAGE);
                return;
            }

            // 转换为文本信息
            let weather = JSON.parse(querystring.unescape(result));
            let content = fs.readFileSync(WEATHER_MESSAGE_FILE).toString();
            content = util.format(content, weather.tem2, weather.tem1, weather.wea);
            resolve(content);
        }, reject);
    });

    let promiseNews = new Promise((resolve, reject) => { // 请求新闻数据
        let newsOption = optionUtil.newNewsOption();
        requestWithRetry(newsOption, INFO_NEWS, (result) => {
            if (!result) {
                resolve(NEWS_FAIL_MESSAGE);
                return;
            }

            // 转为文本信息
            let news = JSON.parse(result).result;
            let content = "";
            for (let i = 0; i < news.length && i < NEWS_COUNT; i++) {
                content += `【${i+1}】[${news[i].title}](${news[i].path})  \n`;
            }
            resolve(content);
        });
    });

    let promiseCurrentNews = new Promise((resolve, reject) => { // 请求新闻数据
        let newsOption = optionUtil.newCurrentNewsOption();
        requestWithRetry(newsOption, INFO_CURRENT_NEWS, (result) => {
            if (!result) {
                resolve(CURRENT_NEWS_FAIL_MESSAGE);
                return;
            }

            // 转为文本信息
            let news = JSON.parse(result).news;
            let content = "";
            for (let i = 0; i < CURRENT_NEWS_COUNT; i++) {
                content += `【${NEWS_COUNT+i+1}】[${news[i].title}](${news[i].url})  \n`;
            }
            resolve(content);
        });
    });

    let promiseImage = new Promise((resolve, reject) => { // 请求图片
        let imageOption = optionUtil.newRandomImageOption();
        requestWithRetry(imageOption, INFO_IMAGE, (result) => {
            if (!result) {
                resolve(IMAGE_FAIL_MESSAGE);
                return;
            }

            let oriPath = path.resolve(__dirname, `../imgs/${moment().format("YYYY-MM-DD")}.jpg`);
            fs.writeFileSync(oriPath, result);
            imagemin([oriPath.replace(/\\/g, "/")], {
                destination: path.resolve(__dirname, "../imgs/opt/"),
                plugins: [
                    imageminPng(),
                    imageminJpeg()
                ]
            }).then(optRes => {
                let path = optRes[0] && optRes[0].destinationPath;
                if (!path) {
                    logger.write({
                        node: "THEN",
                        tag: TAG,
                        obj: optRes
                    });
                    resolve(IMAGE_MIN_FAIL_MESSAGE);
                    return;
                }

                let img = fs.readFileSync(path);
                let base64 = img.toString("base64");
                let md5Generator = crypto.createHash("md5");
                let md5 = md5Generator.update(img).digest("hex");
                resolve({
                    base64,
                    md5
                });
            }).catch(reason => {
                logger.write({
                    node: "CATCH",
                    tag: TAG,
                    obj: reason
                });
                resolve(IMAGE_MIN_FAIL_MESSAGE);
            });
        });
    });

    Promise.all([promiseWeather, promiseNews, promiseCurrentNews, promiseImage])
        .then(value => {
            let text = value[0] + value[1] + value[2];
            let {
                base64,
                md5
            } = value[3];


            if (!base64 || !md5) {
                text += value[3];
            }

            let markdownOption = optionUtil.newRobotMarkdownOption(text);

            logger.start(TAG, markdownOption, INFO_POST_MARKDOWN);
            request.post(markdownOption, (err, res, body) => {
                logger.writeResponse(TAG, err, res, body);

                logger.end(TAG, undefined, INFO_POST_MARKDOWN);
            });

            if (base64 && md5) {
                let imgOption = optionUtil.newRobotImageOption(base64, md5);

                logger.start(TAG, imgOption, INFO_POST_IMAGE);
                request.post(imgOption, (err, res, body) => {
                    logger.writeResponse(TAG, err, res, body);

                    logger.end(TAG, undefined, INFO_POST_IMAGE);
                });
            }
        })
        .catch(reason => console.log(reason));
};

function requestWithRetry(option, info, listener, isPost = false) {
    let retryTime = 0;

    logger.start(TAG, option, info);
    let callback = (err, res, body) => {
        if (logger.writeResponse(TAG, err, res, body, info != INFO_IMAGE)) { // 请求成功
            listener(body);
            logger.end(TAG, undefined, info);
            return;
        }

        if (retryTime++ < MOST_RETRY_TIME) { // 重试几次
            logger.retry(TAG, option, info);
            if (isPost) {
                request.post(option, callback);
            } else {
                request.get(option, callback);
            }
            return;
        }

        listener(false); // 多次重试后放弃
    };
    request.get(option, callback);
}
