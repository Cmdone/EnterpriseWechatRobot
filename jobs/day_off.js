/* jshint esversion: 6 */
const fs = require("fs");
const path = require("path");
const request = require("request");
const logger = require("../logger");
const optionUtil = require("../option_util");

const TAG = "工作日提醒加班打卡";

const MESSAGE_FILE = path.resolve(__dirname, "../messages/text_day_off.txt"); // 消息文本
const MENTIONED_LIST = ["@all"]; // 需要@的人

exports.rule = "0 30 21 * * 1-5";

exports.task = () => {
    let content = fs.readFileSync(MESSAGE_FILE).toString();
    let option = optionUtil.newRobotTextOption(content, MENTIONED_LIST);

    logger.start(TAG, option);
    request.post(option, (err, res, body) => {
        logger.writeResponse(TAG, err, res, body);

        logger.end(TAG);
    });
};
