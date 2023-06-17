# 消息通知系统

使用示例：
let webClient = notifyClient.notifyClient;

await webClient.createInstance('ws://localhost:8031/');

await webClient.login("");

await webClient.joinChannel("001");

webClient.addNotifyCallback('test', '001', data => {
    console.log(data)
});

webClient.sendNotify({
    notifyType: "test",
    notifyMsg: '{"a":111}',
    channelName: "001"
})