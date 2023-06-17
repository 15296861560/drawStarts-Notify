/*
 * @Description: 
 * @Version: 2.0
 * @Autor: lgy
 * @Date: 2023-02-25 22:02:14
 * @LastEditors: “lgy lgy-lgy@qq.com
 * @LastEditTime: 2023-06-17 16:22:04
 */
export enum CLIENT_STATE {
    disconnect = "disconnect",
    connected = "connected",
    connecting = "connecting",
}

export enum EVENT {
    READY = "READY",
    DISCONNECT = "DISCONNECT",
    NOT_READY = "NOT_READY",
    SYS_PLATFORM = "SYS_PLATFORM",
    SYS_CHANNEL = "SYS_CHANNEL",
    SYS_SINGLE = "SYS_SINGLE",
    LOGINED = "LOGINED",
    REQUEST_FEEDBACK = "REQUEST_FEEDBACK",
}

export enum SEND_TYPE {
    request = "request",
    notify = "notify",
}

export enum MSG_TYPE {
    all = "all",
    channel = "channel",
    single = "single",
}

export enum WS_MSG_TYPE {
    feedback = "feedback",
    sys = "sys",
    notify = "notify",
}

export enum METHOD_TYPE {
    login = "login",
    logout = "logout",
    joinChannel = "joinChannel",
    leaveChannel = "leaveChannel",
    getAttributes = "getAttributes",
    getChannelAttribute = "getChannelAttribute",
}

export const NO_LOGIN_METHOD = [String(METHOD_TYPE.login)];

export const REQUEST_TIMEOUT=1000*60;
