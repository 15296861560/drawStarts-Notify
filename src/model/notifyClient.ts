/*
 * @Description: 
 * @Version: 2.0
 * @Autor: lgy
 * @Date: 2023-02-21 23:53:13
 * @LastEditors: “lgy lgy-lgy@qq.com
 * @LastEditTime: 2023-06-17 16:58:19
 * @Author: “lgy lgy-lgy@qq.com
 * @FilePath: \drawStarts-Notify\src\model\notifyClient.ts
 * 
 * Copyright (c) 2023 by ${git_name_email}, All Rights Reserved. 
 */
import EventEmitter from "eventemitter3";
import { generateId } from "../utils"
import { CLIENT_STATE, EVENT, SEND_TYPE, METHOD_TYPE, WS_MSG_TYPE, MSG_TYPE, NO_LOGIN_METHOD, REQUEST_TIMEOUT } from "../constant"
import { Config, WSRequest, Feedback, RequestFeedback, SendRequest, SystemMsg, Notify } from "../interface"

/*
 * @Description: 
 * @Version: 2.0
 * @Autor: lgy
 * @Date: 2023-02-21 23:53:13
 * @LastEditors: “lgy lgy-lgy@qq.com
 * @LastEditTime: 2023-03-09 23:27:05
 */
function showTips(type: string, msg: string) {
    console.log(`${type}:${msg}`)
}

export class NotifyClient extends EventEmitter {
    //客户端id
    private clientId: string;
    // 用户id
    private userId: string;
    // ws连接
    private wsClient: any;
    // 已加入的频道
    private channels: Map<string, Object>;
    // 配置信息
    private config: Config;
    // 属性信息
    private attribute: any;
    // 连接是否已建立
    private isReady: Boolean;
    // 是否已登录
    private isLogin: Boolean;
    // 当前连接状态
    private state: string;
    // 通知回调函数
    private notifyCallbackMap: Map<string, Array<Function>>;
    // 各个频道对应的通知
    private notifyParams: Map<string, string>;
    // 重连次数
    private reconnectionTimes: number;
    // 登录票据
    private token: string;
    constructor() {
        super();
        this.clientId = '';
        this.userId = '';
        this.wsClient = null;
        this.channels = new Map();
        this.config = { url: '' };
        this.attribute = {};
        this.isReady = false;
        this.isLogin = false;
        this.state = CLIENT_STATE.disconnect;
        this.notifyCallbackMap = new Map();
        this.notifyParams = new Map();
        this.reconnectionTimes = 0;
        this.token = '';
    }

    get channelInfo() {
        return this.attribute;
    }


    // 创建实例
    async createInstance(url: string) {
        return new Promise((resolve, reject) => {
            this.clientId = generateId(20);
            this.wsClient = new WebSocket(url);
            this.wsClient.addEventListener("open", () => {
                this.isReady = true;
                this.state = CLIENT_STATE.connected;
                this.config.url = url;
                this.subscribeClient();
                showTips("success", "ws open");
                this.emit(EVENT.READY);
                resolve(true);
            });
            this.wsClient.addEventListener("error", (e: any) => {
                reject(e);
            })
        })

    }

    // 登录认证
    async login(token: string) {
        let param = {
            method: METHOD_TYPE.login,
            token,
            clientId: this.clientId,
        }

        return this.sendRequest(param);
    }

    // 登出认证
    async logout(token: string) {
        let param = {
            method: METHOD_TYPE.logout,
            token,
            clientId: this.clientId,
        }

        return this.sendRequest(param);
    }

    // 开始重连
    startReconnect() {
        if (this.state === CLIENT_STATE.connected) {
            showTips('success', '重连成功');
            this.reconnectionTimes = 0;
            setTimeout(() => {
                this.login(this.token)
            }, 1000)
            return;
        } else {
            this.reconnectionTimes++;
            showTips('error', `${this.reconnectionTimes}次重连中。。。`);
            this.createInstance(this.config.url);
            setTimeout(() => {
                this.startReconnect();
            }, 5 * 1000)
        }
    }

    // 发布监听
    private subscribeClient() {

        this.wsClient.addEventListener("close", () => {
            this.emit(EVENT.DISCONNECT);
            this.emit(EVENT.NOT_READY);
            showTips("error", "ws close");
            this.state = CLIENT_STATE.disconnect;
            this.startReconnect();
        });
        this.wsClient.addEventListener("message", (event: any) => {
            let data: any = JSON.parse(event.data);
            switch (data.type) {
                // 操作反馈
                case WS_MSG_TYPE.feedback:
                    this.feedbackHandle(data);
                    break;
                // 系统消息
                case WS_MSG_TYPE.sys:
                    this.sysHandle(data);
                    break;
                // 通知
                case WS_MSG_TYPE.notify:
                    this.notifyHandle(data);
                    break;
                default:
                    break;
            }
        });
    }

    private feedbackHandle(data: Feedback) {
        this.emit(EVENT.REQUEST_FEEDBACK, data)

        try {
            const res: RequestFeedback = data.res;

            // 请求失败
            if (!res.status) {
                throw (res.data)
            }


            switch (res.method) {
                case METHOD_TYPE.login:
                    this.isLogin = true;
                    this.userId = res.data.userId;
                    this.token = res.data.token;
                    this.emit(EVENT.LOGINED);
                    this.getAttributes();
                    break;

                case METHOD_TYPE.joinChannel:
                    this.channels.set(res.data.channelName, { isJoin: true, joinTime: new Date().getTime(), msgList: [] });
                    this.getChannelAttribute(res.data.channelName);
                    break;

                case METHOD_TYPE.leaveChannel:
                    this.channels.delete(res.data.channelName);
                    break;

                case METHOD_TYPE.getAttributes:
                    this.attribute = res.data.attribute;
                    break;

                case METHOD_TYPE.getChannelAttribute:
                    let channelName: string = res.data.channelName;
                    this.attribute[channelName] = res.data.attribute;
                    Object.keys(this.attribute[channelName]).forEach(notifyKey => {
                        this.notifyParams.set(notifyKey, this.attribute[channelName][notifyKey])
                    })
                    break;
                default:
                    break;
            }

        } catch (e: any) {
            showTips("error", e);

        }

    }
    private sysHandle(data: SystemMsg) {
        switch (data.msgType) {
            // 平台消息
            case MSG_TYPE.all:
                this.emit(EVENT.SYS_PLATFORM, data)
                break;
            // 特定群体消息
            case MSG_TYPE.channel:
                this.emit(EVENT.SYS_CHANNEL, data)
                break;
            // 个人消息
            case MSG_TYPE.single:
                this.emit(EVENT.SYS_SINGLE, data)
                break;
            default:
                break;
        }
    }
    private notifyHandle(data: Notify) {
        let notifyKey: string = `${data.notifyType}:${data.channelName}`;
        let callbackList: Array<Function> = this.notifyCallbackMap.get(notifyKey) || [];
        let param = JSON.parse(data.notifyMsg || '{}');
        callbackList.forEach(callback => {
            callback(param);
        })

    }

    // 发送前校验
    private sendVerify(param: WSRequest) {
        if (param.type === SEND_TYPE.request && NO_LOGIN_METHOD.indexOf(param.method) > -1) {
            return this.isReady;
        } else {
            return this.isReady && this.isLogin;
        }
    }

    // 通过ws发送请求
    private sendRequest(param: any) {
        return new Promise((resolve, reject) => {
            param.type = SEND_TYPE.request;
            const requestId = `${this.clientId}-${param.type}-${param.method}-${new Date().getTime()}`;
            param.requestId = requestId;
            this.send(param);

            const requestHandle = (data: Feedback) => {

                if (data.requestId === requestId) {
                    const res: RequestFeedback = data.res;
                    if (res.status) {
                        resolve(res)
                    } else {
                        reject(res)
                    }
                    this.off(EVENT.REQUEST_FEEDBACK, requestHandle);
                }

            }
            const timeout = setTimeout(() => {
                this.off(EVENT.REQUEST_FEEDBACK, requestHandle);
                resolve('timeout...')
            }, REQUEST_TIMEOUT)
            this.on(EVENT.REQUEST_FEEDBACK, requestHandle);



        })

    }


    /**
    * @description: 通过ws发送通知
    * @param {
    * type:String,
    * notifyType:String
    * notifyMsg:String
    * channelName:String
    * } params
    * @return {*}
    * @author: lgy
    */
    sendNotify(param: WSRequest) {
        param.type = SEND_TYPE.notify;
        this.send(param);
    }

    // 发送消息
    private send(param: WSRequest) {
        if (!this.sendVerify(param)) {
            return
        }
        param.sendTime = new Date().getTime();
        param.userId = this.userId;
        param.clientId = this.clientId;
        let paramStr: string = JSON.stringify(param);
        this.wsClient.send(paramStr);
    }


    // 加入频道
    async joinChannel(channelName: string) {
        let param = { method: METHOD_TYPE.joinChannel, channelName };
        return this.sendRequest(param);
    }
    // 离开频道
    async leaveChannel(channelName: string) {
        let param = { method: METHOD_TYPE.leaveChannel, channelName };
        return this.sendRequest(param);
    }
    // 销毁实例
    destroyed() {
        this.state = EVENT.DISCONNECT;
        this.wsClient = null;
    }

    // 获取属性
    private async getAttributes() {
        let param = {
            method: METHOD_TYPE.getAttributes
        }

        return this.sendRequest(param);
    }
    // 获取某频道的属性
    private async getChannelAttribute(channelName: string) {
        let param = {
            channelName,
            method: METHOD_TYPE.getChannelAttribute
        }

        return this.sendRequest(param);
    }

    // 添加通知回调执行函数
    addNotifyCallback(type: string, channelName: string, callback: Function, firstExecute: Boolean = false) {
        const notifyKey: string = `${type}:${channelName}`;
        let callbackList: Array<Function> = this.notifyCallbackMap.get(notifyKey) || [];
        // 判断是否重复添加回调
        if (!callbackList.find(c => c === callback)) {
            callbackList.push(callback);
            this.notifyCallbackMap.set(notifyKey, callbackList);
        }
        // 挂载时是否需要执行
        if (firstExecute) {
            let paramStr = this.notifyParams.get(notifyKey) || '{}';
            callback(JSON.parse(paramStr));
        }
    }
    // 删除通知回调
    deleteNotifyCallback(type: string, channelName: string) {
        const notifyKey: string = `${type}:${channelName}`;
        this.notifyCallbackMap.delete(notifyKey);
    }
    // 删除通知回调执行函数
    deleteCallback(type: string, channelName: string, callback: Function) {
        let notifyKey: string = `${type}:${channelName}`;
        let callbackList: Array<Function> = this.notifyCallbackMap.get(notifyKey) || [];
        let callbackIndex = callbackList.findIndex(c => c === callback);
        callbackList.splice(callbackIndex, 1)
    }

}
