/* jshint esversion: 6 */

const fs = require("fs");
const moment = require("moment");

/***************
 * 记录日志模块 *
 ***************/

const TIME_FORMAT = "YYYY-MM-DD HH:mm:ss"; // 时间格式
const LOG_FILE_NAME = './log.txt'; // 日志文件名

/**
 * 将日志打印到控制台或记录到文件
 * @param  {String}  [node="NODE"]    节点标识符
 * @param  {String}  [tag="TAG"]      标签
 * @param  {String}  [info=""]        日志内容
 * @param  {Object}  obj              附带对象，仅且一定通过控制台输出
 * @param  {Boolean} [toConsole=true] 是否打印到控制台，默认是
 * @param  {Boolean} [toFile=true]    是否记录到文件，默认是
 */
exports.write = ({
    node = "NODE",
    tag = "TAG",
    info,
    obj
}, toConsole = true, toFile = true) => {
    let logInfo = `${moment().format(TIME_FORMAT)} [${node}] ${tag}` + (info ? `: ${info}` : "");

    if (toConsole) {
        console.log(logInfo);
    }

    if (toFile) {
        fs.writeFileSync(LOG_FILE_NAME, `${logInfo}\n`, {
            flag: "a"
        });
    }

    if (obj) {
        console.log(obj);
    }
};

/**
 * 将请求结果写入日志，并返回是否成功请求
 * @param  {String} tag  标签
 * @param  {[type]} err  错误信息
 * @param  {[type]} res  请求响应
 * @param  {[type]} body 请求结果
 * @return {Boolean}     请求是否成功
 */
exports.writeResponse = (tag, err, res, body, writeBody = true) => {
    if (err) {
        exports.write({
            node: "ERROR-INFO",
            tag,
            info: err
        });
        return false;
    }

    if (!res || res.statusCode != 200) {
        exports.write({
            node: "ERROR-RES",
            tag,
            info: res ? JSON.stringify(res) : "res is undefined",
            obj: res
        });
        return false;
    }

    exports.write({
        node: "SUCCESS",
        tag,
        info: (writeBody) ? body : undefined
    });
    return true;
};

exports.start = (tag, obj, info, toConsole = true, toFile = false) => exports.write({
    node: "START",
    tag,
    info,
    obj
}, toConsole, toFile);

exports.end = (tag, obj, info, toConsole = true, toFile = false) => exports.write({
    node: "END",
    tag,
    info,
    obj
}, toConsole, toFile);

exports.retry = (tag, obj, info, toConsole = true, toFile = false) => exports.write({
    node: "RETRY",
    tag,
    info,
    obj
}, toConsole, toFile);
