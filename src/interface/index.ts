export interface Config {
    url: string
}

export interface WSRequest {
    method: string,
    type: string,
    sendTime: number,
    userId: string,
    clientId: string,
}

export interface Feedback {
    type: string,
    res: any,
}

export interface RequestFeedback {
    type: string,
    status: boolean,
    method: string,
    data: any,
}

export interface SystemMsg {
    type: string,
    msgType: string,
    data: any,
}

export interface Notify {
    type: string,
    notifyType: string,
    channelName: string,
    notifyMsg: string,
}

