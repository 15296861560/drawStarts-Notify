/*
 * @Description: 
 * @Version: 2.0
 * @Autor: lgy
 * @Date: 2023-02-25 22:02:14
 * @LastEditors: “lgy lgy-lgy@qq.com
 * @LastEditTime: 2023-03-10 00:07:50
 */
export const CLIENT_STATE = {
    disconnect: "disconnect",
    connected: "connected",
    connecting: "connecting",
}

export const EVENT = {
    READY: "READY",
    DISCONNECT: "DISCONNECT",
    NOT_READY: "NOT_READY",
    SYS_PLATFORM: "SYS_PLATFORM",
    SYS_CHANNEL: "SYS_CHANNEL",
    SYS_SINGLE: "SYS_SINGLE",
}

export const SEND_TYPE = {
    request: "request",
    notify: "notify",
}

export const MSG_TYPE = {
    all: "all",
    channel: "channel",
    single: "single",
}

export const WS_MSG_TYPE = {
    feedback: "feedback",
    sys: "sys",
    notify: "notify",
}

export const METHOD_TYPE = {
    login: "login",
    logout: "logout",
    joinChannel: "joinChannel",
    leaveChannel: "leaveChannel",
    getAttributes: "getAttributes",
    getChannelAttribute: "getChannelAttribute",
}

export const NO_LOGIN_METHOD = [METHOD_TYPE.login];

