/* jshint esversion: 6 */
const querystring = require("querystring"); // URL参数解析模块

// 机器人POST地址
const robotUrl = "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=0831a120-b59d-4edf-9fef-6a3a7979d778";

// 天气GET地址
const weatherUrl = "https://www.tianqiapi.com/api/?" + querystring.stringify({
    version: "v6", // v6实时天气
    cityid: 101280604, // 定位于南山区
    appid: 63391117,
    appsecret: "mXhEVw3g"
});

// 随机图片GET地址
const randomImgUrl = "https://v1.api.pixivic.com/illust?" + querystring.stringify({
    isOriginal: true,
    isR18: true
});

// 新闻POST地址
const newsUrl = "https://api.apiopen.top/getWangYiNews";

// Currents API新闻
const currentNewsUrl = "https://api.currentsapi.services/v1/latest-news?" + querystring.stringify({
    language: "zh",
    apiKey: "Gg62Kjbt3ySU_rJh4l5FQQ5bZ8VoNC9OPTr1ur1YGN7mQLwI"
});

/**
 * 创建一个机器人PUSH文本类型参数
 * @param  {[type]} content                    文本内容
 * @param  {[type]} [mentionedMobileList=null] 手机号列表，表示需要@的人，仅对text类型生效
 * @param  {[type]} [mentionedList=null]       userid列表，表示需要@的人，仅对text类型生效
 */
exports.newRobotTextOption = (content, mentionedMobileList = null, mentionedList = null) => {
    let body = {
        msgtype: "text",
        text: {
            content: content
        }
    };
    if (mentionedList != null) {
        body.text.mentioned_list = mentionedList;
    }
    if (mentionedMobileList != null) {
        body.text.mentioned_mobile_list = mentionedMobileList;
    }

    let res = newRobotGeneralOption();
    res.body = JSON.stringify(body);

    return res;
};

/**
 * // TODO: res.body
 * 创建一个机器人PUSH markdown类型参数
 */
exports.newRobotMarkdownOption = (content) => {
    let body = {
        msgtype: "markdown",
        markdown: {
            content
        }
    };

    let res = newRobotGeneralOption();
    res.body = JSON.stringify(body);

    return res;
};

/**
 * 创建一个机器人PUSH图片类型参数
 */
exports.newRobotImageOption = (base64, md5) => {
    let body = {
        msgtype: "image",
        image: {
            base64: base64,
            md5: md5
        }
    };

    let res = newRobotGeneralOption();
    res.body = JSON.stringify(body);

    return res;
};

/**
 * // TODO: res.body
 * 创建一个机器人PUSH图文类型参数
 */
exports.newRobotNewsOption = () => {
    let res = newRobotGeneralOption();
    res.body = {
        msgtype: "news",
        news: {
            "articles": [],
        }
    };

    return res;
};

function newRobotGeneralOption() {
    return {
        url: robotUrl,
        headers: {
            "Content-Type": "application/json"
        }
    };
}

/**
 * 创建一个获取天气参数
 */
exports.newWeatherOption = () => ({
    url: weatherUrl
});


exports.newRandomImageOption = () => ({
    url: randomImgUrl,
    encoding: null,
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36",
    },
    removeRefererHeader: true // 由于API内存在重定向至新浪图床，需要移除referer
});


exports.newNewsOption = () => ({
    url: newsUrl,
    form: {
        page: 1,
        count: 10
    }
});


exports.newCurrentNewsOption = () => ({
    url: currentNewsUrl
});
