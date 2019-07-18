let fs = require("fs")
let request = require("request")
let moment = require("moment")
let schedule = require("node-schedule")

// 请求参数模板
function genOptions() {
  return {
    url: "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=0831a120-b59d-4edf-9fef-6a3a7979d778",
    headers: {
      "Content-Type": "application/json"
    }
  }
}

// 每周四11点外卖提醒
schedule.scheduleJob("0 0 11 * * 4", () => {
  let options = genOptions()
  options.body = fs.readFileSync("./jsons/KFC.json").toString()
  request.post(options, (err, res, body) => {
    let temp = moment().format("YYYY-MM-DD HH:mm:ss") + ": " + body + "\n"
    fs.writeFile('./log.txt', temp, {
      flag: "a"
    }, (err) => {})
  })
})
