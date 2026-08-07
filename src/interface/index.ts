export interface Config {
  url: string
  heartbeatInterval?: number
  requestTimeout?: number
  autoReconnect?: boolean
  /** 收到 needAck 消息时自动回执 */
  autoAck?: boolean
}

export interface WSRequest {
  method?: string
  type?: string
  sendTime?: number
  userId?: string
  clientId?: string
  requestId?: string
  channelName?: string
  token?: string
  msgType?: string
  targetUserId?: string | string[]
  targetClientId?: string
  notifyType?: string
  notifyMsg?: string
  messageId?: string
  needAck?: boolean
  cursor?: string
  limit?: number
  excludeSender?: boolean
  createdAt?: number
}

export interface Feedback {
  requestId: string
  type: string
  res: RequestFeedback
}

export interface RequestFeedback {
  status: boolean
  method: string
  code?: number
  message?: string
  data: any
}

export interface SystemMsg {
  type: string
  msgType: string
  event?: string
  data: any
}

export interface Notify extends WSRequest {
  notifyType: string
  channelName: string
  notifyMsg: string
  msgType?: string
  messageId?: string
  needAck?: boolean
}

export interface SendNotifyParam {
  notifyType: string
  notifyMsg: string
  channelName?: string
  msgType?: string
  targetUserId?: string | string[]
  targetClientId?: string
  needAck?: boolean
  excludeSender?: boolean
  /** 是否等待服务端 feedback */
  waitAck?: boolean
}
