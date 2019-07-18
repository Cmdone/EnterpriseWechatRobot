let request = require("request")
let fs = require("fs")
let crypto = require("crypto")

let hash = crypto.createHash("md5")

function genOptions() {
  return {
    url: "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=0831a120-b59d-4edf-9fef-6a3a7979d778",
    headers: {
      "Content-Type": "application/json"
    }
  }
}

request.get({
  url: "https://www.tianqiapi.com/api/?version=v6&cityid=101280604",
}, (err, res, body) => {
  // 转码Unicode & 转为JSON
  let obj = JSON.parse(unescape(body.replace(/\\u/g, "%u")))
  let info = "天气小提示：\n当前" + obj.city + "天气：" + obj.wea + "，" + obj.tem + "℃\n"
  info += obj.air_tips + "\n"
  info += "今日气温：" + obj.tem1 + "℃" + " ~ " + obj.tem2 + "℃"

  let reqJSON = {
    msgtype: "text",
    text: {}
  }
  reqJSON.text.content = info
  let option1 = genOptions()
  option1.body = JSON.stringify(reqJSON)
  // console.log(option1)
  // request.post(option1, (err, res, body) => {})


  let img = fs.readFileSync("./gif/" + obj.wea_img + ".gif")
  let md5 = hash.update(img).digest("hex")
  let img_64 = img.toString("base64")
  let reqJSON2 = {
    msgtype: "image",
    image: {
      base64: img_64,
      md5: md5
    }
  }
  let option2 = genOptions()
  option2.body = JSON.stringify(reqJSON2)
  console.log(option2)
  request.post(option2, (err, res, body) => {
    console.log(body)
  })
})
