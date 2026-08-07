import EventEmitter from 'eventemitter3'
import { generateId } from '../utils'
import {
  CLIENT_STATE,
  EVENT,
  SEND_TYPE,
  METHOD_TYPE,
  WS_MSG_TYPE,
  MSG_TYPE,
  NO_LOGIN_METHOD,
  REQUEST_TIMEOUT,
  DEFAULT_HEARTBEAT_INTERVAL,
  ERROR_CODE,
  SYS_EVENT,
} from '../constant'
import {
  Config,
  WSRequest,
  Feedback,
  RequestFeedback,
  SystemMsg,
  Notify,
  SendNotifyParam,
} from '../interface'

function showTips(type: string, msg: string) {
  console.log(`[notify-client] ${type}: ${msg}`)
}

export class NotifyClient extends EventEmitter {
  private clientId = ''
  private userId = ''
  private wsClient: WebSocket | null = null
  private channels: Map<string, { isJoin: boolean; joinTime: number }> = new Map()
  private config: Config = { url: '', autoReconnect: true }
  private attribute: any = {}
  private isReady = false
  private isLogin = false
  private state = CLIENT_STATE.disconnect
  private notifyCallbackMap: Map<string, Array<Function>> = new Map()
  private notifyParams: Map<string, string> = new Map()
  private reconnectionTimes = 0
  private token = ''
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private manualClose = false
  private seenMessageIds = new Set<string>()

  get channelInfo() {
    return this.attribute
  }

  get ready() {
    return this.isReady
  }

  get loggedIn() {
    return this.isLogin
  }

  get currentUserId() {
    return this.userId
  }

  get currentClientId() {
    return this.clientId
  }

  async createInstance(url: string, options: Partial<Config> = {}) {
    this.manualClose = false
    this.config = {
      url,
      autoReconnect: options.autoReconnect !== false,
      heartbeatInterval: options.heartbeatInterval ?? DEFAULT_HEARTBEAT_INTERVAL,
      requestTimeout: options.requestTimeout ?? REQUEST_TIMEOUT,
      autoAck: options.autoAck !== false,
    }

    return new Promise<boolean>((resolve, reject) => {
      this.clientId = generateId(20)
      this.state = CLIENT_STATE.connecting
      this.wsClient = new WebSocket(url)

      const onOpen = () => {
        this.isReady = true
        this.state = CLIENT_STATE.connected
        this.subscribeClient()
        this.startHeartbeat()
        showTips('success', 'ws open')
        this.emit(EVENT.READY)
        resolve(true)
      }
      const onError = (e: Event) => {
        reject(e)
      }

      this.wsClient.addEventListener('open', onOpen, { once: true })
      this.wsClient.addEventListener('error', onError, { once: true })
    })
  }

  async login(token: string) {
    this.token = token
    const param = {
      method: METHOD_TYPE.login,
      token,
      clientId: this.clientId,
    }
    const res = (await this.sendRequest(param)) as RequestFeedback
    if (res.status) {
      this.isLogin = true
      this.userId = res.data.userId
      this.token = res.data.token
      this.emit(EVENT.LOGINED)
      await this.fetchAttributes()
    }
    return res
  }

  async logout() {
    try {
      const res = (await this.sendRequest({
        method: METHOD_TYPE.logout,
        token: this.token,
        clientId: this.clientId,
      })) as RequestFeedback
      return res
    } finally {
      this.clearSession()
      this.emit(EVENT.LOGOUT)
    }
  }

  async joinChannel(channelName: string) {
    const res = (await this.sendRequest({
      method: METHOD_TYPE.joinChannel,
      channelName,
    })) as RequestFeedback
    if (res.status) {
      await this.fetchChannelAttribute(res.data.channelName)
      this.channels.set(res.data.channelName, {
        isJoin: true,
        joinTime: Date.now(),
      })
    }
    return res
  }

  async leaveChannel(channelName: string) {
    const res = (await this.sendRequest({
      method: METHOD_TYPE.leaveChannel,
      channelName,
    })) as RequestFeedback
    if (res.status) {
      this.channels.delete(res.data.channelName)
    }
    return res
  }

  /** 公开：获取自身会话属性 */
  async fetchAttributes() {
    const res = (await this.sendRequest({
      method: METHOD_TYPE.getAttributes,
    })) as RequestFeedback
    if (res.status) {
      this.attribute = {
        ...this.attribute,
        self: res.data.attribute,
      }
    }
    return res
  }

  /** 公开：获取频道通知缓存属性 */
  async fetchChannelAttribute(channelName: string) {
    const res = (await this.sendRequest({
      method: METHOD_TYPE.getChannelAttribute,
      channelName,
    })) as RequestFeedback
    if (res.status) {
      const name: string = res.data.channelName
      this.attribute[name] = res.data.attribute
      Object.keys(res.data.attribute || {}).forEach((notifyKey) => {
        this.notifyParams.set(notifyKey, res.data.attribute[notifyKey])
      })
    }
    return res
  }

  /**
   * 发送通知
   * msgType: channel(默认) | single | all
   */
  async sendNotify(param: SendNotifyParam) {
    const payload: WSRequest = {
      type: SEND_TYPE.notify,
      notifyType: param.notifyType,
      notifyMsg: param.notifyMsg,
      channelName: param.channelName,
      msgType: param.msgType || MSG_TYPE.channel,
      targetUserId: param.targetUserId,
      targetClientId: param.targetClientId,
      needAck: param.needAck,
      excludeSender: param.excludeSender,
    }

    if (param.waitAck) {
      return this.sendRequest({
        ...payload,
        method: SEND_TYPE.notify,
      } as any)
    }

    const ok = this.send(payload)
    if (!ok) {
      return {
        status: false,
        method: SEND_TYPE.notify,
        code: ERROR_CODE.NOT_LOGIN,
        message: 'not ready or not login',
        data: {},
      }
    }
    return {
      status: true,
      method: SEND_TYPE.notify,
      code: ERROR_CODE.OK,
      message: 'sent',
      data: {},
    }
  }

  /** 确认已收到消息 */
  async ack(messageId: string) {
    return this.sendRequest({
      method: METHOD_TYPE.ack,
      messageId,
    })
  }

  /** 拉取频道历史 */
  async pullHistory(channelName: string, cursor?: string, limit = 50) {
    return this.sendRequest({
      method: METHOD_TYPE.pullHistory,
      channelName,
      cursor,
      limit,
    })
  }

  /** 主动拉取离线消息 */
  async pullOffline(limit = 50) {
    return this.sendRequest({
      method: METHOD_TYPE.pullOffline,
      limit,
    })
  }

  addNotifyCallback(
    type: string,
    channelName: string,
    callback: Function,
    firstExecute = false
  ) {
    const notifyKey = `${type}:${channelName}`
    const callbackList = this.notifyCallbackMap.get(notifyKey) || []
    if (!callbackList.find((c) => c === callback)) {
      callbackList.push(callback)
      this.notifyCallbackMap.set(notifyKey, callbackList)
    }
    if (firstExecute) {
      const paramStr = this.notifyParams.get(notifyKey) || '{}'
      try {
        callback(JSON.parse(paramStr))
      } catch {
        callback({})
      }
    }
  }

  deleteNotifyCallback(type: string, channelName: string) {
    this.notifyCallbackMap.delete(`${type}:${channelName}`)
  }

  deleteCallback(type: string, channelName: string, callback: Function) {
    const notifyKey = `${type}:${channelName}`
    const callbackList = this.notifyCallbackMap.get(notifyKey) || []
    const callbackIndex = callbackList.findIndex((c) => c === callback)
    if (callbackIndex > -1) {
      callbackList.splice(callbackIndex, 1)
    }
  }

  destroyed() {
    this.manualClose = true
    this.stopHeartbeat()
    this.clearReconnectTimer()
    this.clearSession()
    if (this.wsClient) {
      try {
        this.wsClient.close()
      } catch {
        // ignore
      }
    }
    this.wsClient = null
    this.isReady = false
    this.state = CLIENT_STATE.disconnect
    this.emit(EVENT.DISCONNECT)
  }

  private clearSession() {
    this.isLogin = false
    this.userId = ''
    this.channels.clear()
  }

  private startHeartbeat() {
    this.stopHeartbeat()
    const interval = this.config.heartbeatInterval || DEFAULT_HEARTBEAT_INTERVAL
    this.heartbeatTimer = setInterval(() => {
      if (!this.isReady || !this.wsClient || this.wsClient.readyState !== WebSocket.OPEN) {
        return
      }
      void this.sendRequest({ method: METHOD_TYPE.heartbeat }).catch(() => {
        // heartbeat failure handled by reconnect on close
      })
    }, interval)
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private startReconnect() {
    if (this.manualClose || this.config.autoReconnect === false) {
      return
    }
    this.clearReconnectTimer()
    this.reconnectionTimes += 1
    showTips('error', `${this.reconnectionTimes}次重连中...`)
    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.createInstance(this.config.url, this.config)
        if (this.token) {
          await this.login(this.token)
        }
        this.reconnectionTimes = 0
        showTips('success', '重连成功')
      } catch {
        this.startReconnect()
      }
    }, Math.min(5000 * this.reconnectionTimes, 30000))
  }

  private subscribeClient() {
    if (!this.wsClient) {
      return
    }

    this.wsClient.addEventListener('close', () => {
      this.stopHeartbeat()
      this.isReady = false
      this.isLogin = false
      this.state = CLIENT_STATE.disconnect
      this.emit(EVENT.DISCONNECT)
      this.emit(EVENT.NOT_READY)
      showTips('error', 'ws close')
      this.startReconnect()
    })

    this.wsClient.addEventListener('message', (event: MessageEvent) => {
      let data: any
      try {
        data = JSON.parse(String(event.data))
      } catch {
        return
      }
      switch (data.type) {
        case WS_MSG_TYPE.feedback:
          this.emit(EVENT.REQUEST_FEEDBACK, data)
          break
        case WS_MSG_TYPE.sys:
          this.sysHandle(data)
          break
        case WS_MSG_TYPE.notify:
          this.notifyHandle(data)
          break
        default:
          break
      }
    })
  }

  private sysHandle(data: SystemMsg) {
    if (data.event === SYS_EVENT.tokenExpire || data.event === SYS_EVENT.kicked) {
      this.clearSession()
      this.emit(EVENT.TOKEN_EXPIRE, data)
    }
    if (data.event === SYS_EVENT.serverShutdown) {
      showTips('error', 'server shutdown')
    }
    if (data.event === SYS_EVENT.offlineSync) {
      this.emit(EVENT.OFFLINE_SYNC, data)
    }

    switch (data.msgType) {
      case MSG_TYPE.all:
        this.emit(EVENT.SYS_PLATFORM, data)
        break
      case MSG_TYPE.channel:
        this.emit(EVENT.SYS_CHANNEL, data)
        break
      case MSG_TYPE.single:
        this.emit(EVENT.SYS_SINGLE, data)
        break
      default:
        break
    }
  }

  private notifyHandle(data: Notify) {
    if (data.messageId) {
      if (this.seenMessageIds.has(data.messageId)) {
        return
      }
      this.seenMessageIds.add(data.messageId)
      if (this.seenMessageIds.size > 2000) {
        const first = this.seenMessageIds.values().next().value
        if (first) this.seenMessageIds.delete(first)
      }
    }

    this.emit(EVENT.NOTIFY, data)
    const notifyKey = `${data.notifyType}:${data.channelName || ''}`
    const callbackList = this.notifyCallbackMap.get(notifyKey) || []
    let param: any = {}
    try {
      param = JSON.parse(data.notifyMsg || '{}')
    } catch {
      param = data.notifyMsg
    }
    callbackList.forEach((callback) => callback(param, data))

    if (data.needAck && data.messageId && this.config.autoAck !== false) {
      void this.ack(data.messageId).catch(() => {
        // ignore ack failure
      })
    }
  }

  private sendVerify(param: WSRequest) {
    if (param.type === SEND_TYPE.request && param.method && NO_LOGIN_METHOD.indexOf(param.method) > -1) {
      return this.isReady
    }
    if (param.type === SEND_TYPE.notify) {
      return this.isReady && this.isLogin
    }
    return this.isReady && this.isLogin
  }

  private sendRequest(param: any): Promise<RequestFeedback> {
    return new Promise((resolve, reject) => {
      // notify + waitAck 时 type 已是 notify
      if (param.type !== SEND_TYPE.notify) {
        param.type = SEND_TYPE.request
      }
      const requestId = `${this.clientId}-${param.type}-${param.method || 'notify'}-${Date.now()}`
      param.requestId = requestId

      if (!this.send(param)) {
        reject({
          status: false,
          method: param.method || '',
          code: ERROR_CODE.NOT_LOGIN,
          message: 'not ready or not login',
          data: {},
        } as RequestFeedback)
        return
      }

      const timeout = this.config.requestTimeout || REQUEST_TIMEOUT
      const timer = setTimeout(() => {
        this.off(EVENT.REQUEST_FEEDBACK, requestHandle)
        reject({
          status: false,
          method: param.method || '',
          code: ERROR_CODE.TIMEOUT,
          message: 'timeout',
          data: {},
        } as RequestFeedback)
      }, timeout)

      const requestHandle = (data: Feedback) => {
        if (data.requestId !== requestId) {
          return
        }
        clearTimeout(timer)
        this.off(EVENT.REQUEST_FEEDBACK, requestHandle)
        const res = data.res
        if (res.status) {
          resolve(res)
        } else {
          showTips('error', res.message || JSON.stringify(res.data))
          reject(res)
        }
      }
      this.on(EVENT.REQUEST_FEEDBACK, requestHandle)
    })
  }

  private send(param: WSRequest): boolean {
    if (!this.sendVerify(param) || !this.wsClient) {
      return false
    }
    param.sendTime = Date.now()
    param.userId = this.userId
    param.clientId = this.clientId
    this.wsClient.send(JSON.stringify(param))
    return true
  }
}
