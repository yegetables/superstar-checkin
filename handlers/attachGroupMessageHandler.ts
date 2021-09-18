import {Client, ImgPttElem} from 'oicq'
import config from '../providers/config'
import {error, info} from '../utils/log'
import axios from 'axios'
import decodeQrCode from '../utils/decodeQrCode'

export default (bot: Client) => bot.on('message.group', async data => {
    //检查来源
    if (data.group_id !== config.bot.group) return
    //检查屏蔽名单，防止两个机器人一台戏
    if (config.bot.ignore && config.bot.ignore.includes(data.user_id)) return
    //处理 ping 请求
    if (data.raw_message === 'ping') {
        data.reply('pong!')
        return
    }
    //检查图片
    const imageElem = data.message.find(e => e.type === 'image') as ImgPttElem
    if (!imageElem) return info('不是图片')
    //获取图片，识别二维码
    const buf = (await axios.get<Buffer>(imageElem.data.url, {
        responseType: 'arraybuffer',
    })).data
    try {
        const dec = await decodeQrCode(buf)
        let message = '二维码解码：\n' + dec + '\n'

        data.reply(message)
    } catch (e) {
        data.reply(`二维码解码失败：${e}`)
    }
})