/* jshint esversion: 6 */
const fs = require("fs");
const path = require("path");
const request = require("request");
const logger = require("../logger");
const optionUtil = require("../option_util");

const TAG = "每周一周报提醒";

const MESSAGE_FILE = path.resolve(__dirname, "../messages/text_week_report.txt"); // 消息文本

exports.rule = "0 0 10 * * 1";

exports.task = () => {
    let content = fs.readFileSync(MESSAGE_FILE).toString();
    let option = optionUtil.newRobotTextOption(content);

    logger.start(TAG, option);
    request.post(option, (err, res, body) => {
        logger.writeResponse(TAG, err, res, body);

        logger.end(TAG);
    });
};
