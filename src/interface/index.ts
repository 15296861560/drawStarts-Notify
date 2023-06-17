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
    requestId: string,
    type: string,
    res: any,
}

export interface RequestFeedback {
    status: boolean,
    method: string,
    data: any,
}

export interface SendRequest extends WSRequest {
    method: string,
    requestId: string,
    type: string,
}

export interface SystemMsg extends WSRequest {
    msgType: string,
    data: any,
}

export interface Notify extends WSRequest {
    notifyType: string,
    channelName: string,
    notifyMsg: string,
}

