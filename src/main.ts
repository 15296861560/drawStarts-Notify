import { NotifyClient } from './model/notifyClient'
import {
  EVENT,
  ERROR_CODE,
  MSG_TYPE,
  METHOD_TYPE,
  SYS_EVENT,
} from './constant'

const notifyClient = new NotifyClient()

export default {
  notifyClient,
  EVENT,
  ERROR_CODE,
  MSG_TYPE,
  METHOD_TYPE,
  SYS_EVENT,
  NotifyClient,
}

export {
  notifyClient,
  EVENT,
  ERROR_CODE,
  MSG_TYPE,
  METHOD_TYPE,
  SYS_EVENT,
  NotifyClient,
}
