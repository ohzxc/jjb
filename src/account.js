import { getSetting } from './utils'

export const getLoginState = function () {
  let loginState = {
    pc: getSetting('jjb_login-state_pc', {
      state: "unknown"
    }),
    m: getSetting('jjb_login-state_m', {
      state: "unknown"
    }),
    class: "unknown"
  }
  // 处理登录状态
  if (loginState.pc.state == 'alive' && loginState.m.state == 'alive') {
    loginState.class = "alive"
  } else if (loginState.pc.state == 'failed' && loginState.m.state == 'failed') {
    loginState.class = "failed"
  } else if (loginState.pc.state == 'failed' || loginState.m.state == 'failed' || loginState.m.state == 'alive' || loginState.pc.state == 'alive') {
    loginState.class = "warning"
  }
  return loginState
}