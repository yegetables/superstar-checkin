import {Client, Sendable} from 'icqq'
import config from './config'
import attachGroupMessageHandler from '../handlers/attachGroupMessageHandler'
import {error} from '../utils/log'

let bot: Client

export const loginBot = () => new Promise<any>(resolve => {
  if (config.bot.uin === 'disabled') return resolve(0)
  bot = new Client(config.bot.uin, {
    log_level: 'warn',
    data_dir: config.bot.data_dir || process.env.DATA_DIR,
    platform: config.bot.platform || 5,
  })
  bot.once('system.online', resolve)
  //bot.login(config.bot.password)
  if (config.bot.qrlogin === true) {
    bot.on("system.login.qrcode", function (e) {
      //扫码后按回车登录
      console.log("扫码后按回车登录")
      process.stdin.once("data", () => {
        this.login()
      })
    }).login()
  } else {
    bot.on('system.login.slider', (e) => {
      console.log('输入滑块地址获取的ticket后继续。\n滑块地址:    ' + e.url)
      process.stdin.once('data', (data) => {
        bot.submitSlider(data.toString().trim())
      })
    })
    bot.on('system.login.device', (e) => {
      console.log('请选择验证方式:(1：短信验证   其他：扫码验证)')
      process.stdin.once('data', (data) => {
        if (data.toString().trim() === '1') {
          bot.sendSmsCode()
          console.log('请输入手机收到的短信验证码:')
          process.stdin.once('data', (res) => {
            bot.submitSmsCode(res.toString().trim())
          })
        } else {
          console.log('扫码完成后回车继续：' + e.url)
          process.stdin.once('data', () => {
            bot.login()
          })
        }
      })
    })
    bot.login(config.bot.uin, config.bot.password)
  }
  //机器人接收二维码和解码签到事件
  attachGroupMessageHandler(bot)
})

export const pushQMsg = async (message: Sendable) => {
  if (config.bot.uin === 'disabled') return
  try {
    for (const group of config.bot.notifyGroups) {
      await bot.pickGroup(group).sendMsg(message)
    }
  } catch (e) {
    error('QQ 消息发送失败', e)
  }
}

export const pushQMsgToFirstGroup = async (message: Sendable) => {
  if (config.bot.uin === 'disabled') return
  try {
    await bot.pickGroup(config.bot.notifyGroups[0]).sendMsg(message)
  } catch (e) {
    error('QQ 消息发送失败', e)
  }
}
