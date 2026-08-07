# 消息通知系统 - 前端 SDK

`drawstarts-notify@0.2.0` — 对接 `drawstarts-notify-serve` 的浏览器 WebSocket 客户端。

## 使用示例

```js
import notify from 'drawstarts-notify'
const { notifyClient, EVENT, MSG_TYPE } = notify

await notifyClient.createInstance('ws://localhost:8030/', {
  heartbeatInterval: 25000,
  autoReconnect: true,
  autoAck: true, // 收到 needAck 自动回执
})

await notifyClient.login('alice')
await notifyClient.joinChannel('room-demo')

notifyClient.on(EVENT.NOTIFY, (msg) => {
  console.log(msg.messageId, msg.notifyMsg)
})

notifyClient.on(EVENT.OFFLINE_SYNC, (sys) => {
  console.log('offline count', sys.data.count)
})

await notifyClient.sendNotify({
  notifyType: 'chat',
  notifyMsg: JSON.stringify({ text: 'hi' }),
  channelName: 'room-demo',
  needAck: true,
  waitAck: true,
})

await notifyClient.pullHistory('room-demo')
await notifyClient.pullOffline()
await notifyClient.ack('<messageId>')
```

## M2 API

| API | 说明 |
|-----|------|
| `ack(messageId)` | 确认消息 |
| `pullHistory(channel, cursor?, limit?)` | 频道历史 |
| `pullOffline(limit?)` | 离线箱 |
| `autoAck` 配置 | 自动 ACK |

联调页请启动服务端：`cd drawStarts-notify-serve && npm run demo`
