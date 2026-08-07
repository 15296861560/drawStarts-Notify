export enum CLIENT_STATE {
  disconnect = 'disconnect',
  connected = 'connected',
  connecting = 'connecting',
}

export enum EVENT {
  READY = 'READY',
  DISCONNECT = 'DISCONNECT',
  NOT_READY = 'NOT_READY',
  SYS_PLATFORM = 'SYS_PLATFORM',
  SYS_CHANNEL = 'SYS_CHANNEL',
  SYS_SINGLE = 'SYS_SINGLE',
  LOGINED = 'LOGINED',
  LOGOUT = 'LOGOUT',
  TOKEN_EXPIRE = 'TOKEN_EXPIRE',
  REQUEST_FEEDBACK = 'REQUEST_FEEDBACK',
  NOTIFY = 'NOTIFY',
  OFFLINE_SYNC = 'OFFLINE_SYNC',
}

export enum SEND_TYPE {
  request = 'request',
  notify = 'notify',
}

export enum MSG_TYPE {
  all = 'all',
  channel = 'channel',
  single = 'single',
}

export enum WS_MSG_TYPE {
  feedback = 'feedback',
  sys = 'sys',
  notify = 'notify',
}

export enum METHOD_TYPE {
  login = 'login',
  logout = 'logout',
  joinChannel = 'joinChannel',
  leaveChannel = 'leaveChannel',
  getAttributes = 'getAttributes',
  getChannelAttribute = 'getChannelAttribute',
  heartbeat = 'heartbeat',
  ack = 'ack',
  pullHistory = 'pullHistory',
  pullOffline = 'pullOffline',
}

export enum SYS_EVENT {
  tokenExpire = 'tokenExpire',
  kicked = 'kicked',
  serverShutdown = 'serverShutdown',
  rateLimited = 'rateLimited',
  offlineSync = 'offlineSync',
}

export const NO_LOGIN_METHOD = [
  String(METHOD_TYPE.login),
  String(METHOD_TYPE.heartbeat),
]

export const ERROR_CODE = {
  OK: 0,
  NOT_LOGIN: 1001,
  TOKEN_EXPIRE: 1002,
  NO_PERMISSION: 1003,
  INVALID_PARAM: 1004,
  CHANNEL_NOT_FOUND: 1005,
  RATE_LIMITED: 1006,
  PAYLOAD_TOO_LARGE: 1007,
  ORIGIN_DENIED: 1008,
  MESSAGE_NOT_FOUND: 1009,
  INTERNAL: 1099,
  TIMEOUT: 1100,
} as const

export const REQUEST_TIMEOUT = 1000 * 30
export const DEFAULT_HEARTBEAT_INTERVAL = 25000
