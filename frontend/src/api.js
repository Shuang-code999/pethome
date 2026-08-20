// 后端 API 封装（带 JWT 自动携带 + 401 统一处理 + traceId 透传）
const BASE = '/api'

function token() {
  const t = localStorage.getItem('token') || ''
  return t && !t.startsWith('Bearer ') ? `Bearer ${t}` : t
}

/** 401 监听：触发自定义事件，App.jsx 收到后跳登录页 */
const AUTH_EVENT = 'pethome:auth:required'
function emitAuthRequired() {
  try { window.dispatchEvent(new CustomEvent(AUTH_EVENT)) } catch {}
}

function handle401() {
  localStorage.removeItem('token')
  localStorage.removeItem('pethomeUser')
  emitAuthRequired()
}

async function parse(res) {
  const data = await res.json().catch(() => ({ code: res.status, msg: res.statusText, traceId: res.headers.get('X-Trace-Id') }))
  // 业务层 401（后端 BizException.UNAUTHORIZED）
  if (data && data.code === 401) handle401()
  return data
}

export async function post(path, body) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: token()
    },
    body: JSON.stringify(body || {})
  })
  if (res.status === 401) handle401()
  return parse(res)
}

export async function get(path) {
  const res = await fetch(BASE + path, {
    headers: { authorization: token() }
  })
  if (res.status === 401) handle401()
  return parse(res)
}

export async function put(path, body) {
  const res = await fetch(BASE + path, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      authorization: token()
    },
    body: JSON.stringify(body || {})
  })
  if (res.status === 401) handle401()
  return parse(res)
}

export async function del(path) {
  const res = await fetch(BASE + path, {
    method: 'DELETE',
    headers: { authorization: token() }
  })
  if (res.status === 401) handle401()
  return parse(res)
}

export function setToken(t) {
  localStorage.setItem('token', t)
}
export function clearToken() {
  localStorage.removeItem('token')
}

export async function upload(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(BASE + '/file/upload', {
    method: 'POST',
    headers: { authorization: token() },
    body: form
  })
  return res.json().catch(() => ({ code: res.status, msg: res.statusText }))
}

export async function randomImage(query) {
  const res = await fetch(BASE + '/image/random?query=' + encodeURIComponent(query))
  return res.json().catch(() => ({ code: res.status, msg: res.statusText }))
}

// ---- 业务接口 ----
export const api = {
  // 发送短信验证码（未配置时后端控制台打印）
  sendSmsCode: (phone) => post(`/user/sms/${phone}`),
  // 手机号短信验证码登录
  loginByPhone: (phone, code) => post('/user/login/phone', { phone, code }),
  // 当前用户资料 + 修改昵称/头像
  me: () => get('/user/me'),
  updateMe: (body) => put('/user/me', body),

  // 用户公开主页（不含隐私字段）
  userProfile: (id) => get(`/user/${id}/profile`),
  // 某用户的帖子列表
  userPosts: (userId, size = 20) => get(`/community/user/${userId}/posts?size=${size}`),

  // 宠物档案 CRUD（需登录）
  myPets: () => get('/pet/list'),
  petDetail: (id) => get(`/pet/${id}`),
  createPet: (pet) => post('/pet', pet),
  updatePet: (id, pet) => put(`/pet/${id}`, pet),
  deletePet: (id) => del(`/pet/${id}`),

  // 商品（公开，支持分类/关键词/分页）
  products: (params = {}) => {
    const q = new URLSearchParams()
    if (params.category) q.set('category', params.category)
    if (params.keyword) q.set('keyword', params.keyword)
    if (params.page) q.set('page', params.page)
    if (params.size) q.set('size', params.size)
    return get('/product/list?' + q.toString())
  },
  productDetail: (id) => get(`/product/${id}`),

  // 秒杀（列表公开，抢券/支付需登录）
  seckillList: () => get('/seckill/list'),
  seckill: (voucherId) => post(`/seckill/${voucherId}`),
  seckillPay: (orderId) => post(`/seckill/pay/${orderId}`),

  // 社区
  feed: (tab = 'recommend', max = 0, size = 20, type = '') => get(`/community/feed?tab=${tab}&max=${max}&size=${size}&type=${type}`),
  getPost: (id) => get(`/community/posts/${id}`),
  createPost: (post) => post('/community/posts', post),
  likePost: (id) => post(`/community/posts/${id}/like`),
  unlikePost: (id) => del(`/community/posts/${id}/like`),
  isLikedPost: (id) => get(`/community/posts/${id}/liked`),
  postComments: (id) => get(`/community/posts/${id}/comments`),
  commentPost: (id, content, parentId) => post(`/community/posts/${id}/comments`, { content, parentId }),

  // 关注
  follow: (userId) => post(`/follow/${userId}`),
  unfollow: (userId) => del(`/follow/${userId}`),
  followees: () => get('/follow/followees'),
  isFollowing: (userId) => get(`/follow/is-following/${userId}`),

  // 宠物健康记录与提醒
  healthRecords: (petId) => get(`/pet/${petId}/health`),
  createHealthRecord: (petId, record) => post(`/pet/${petId}/health`, record),
  reminders: () => get('/reminders'),
  createReminder: (r) => post('/reminders', r),
  doneReminder: (id) => post(`/reminders/${id}/done`),

  // 消息中心（提醒到期通知等）
  notifications: () => get('/notification/list'),
  unreadCount: () => get('/notification/unread-count'),
  markNotificationRead: (id) => post(`/notification/${id}/read`),
  markAllNotificationsRead: () => post('/notification/read-all'),

  // 天气（OpenWeatherMap）
  weather: (lat, lng) => get(`/weather?lat=${lat}&lng=${lng}`),

  // IP 定位降级：浏览器 geolocation 失败时用 IP 反查城市
  ipCity: () => get('/location/ip-city'),

  // 逆地理编码：经纬度 → 中文城市名（仅 UI 显示用，不影响坐标精度）
  regeo: (lat, lng) => get(`/location/regeo?lat=${lat}&lng=${lng}`),

  // 支付（支付宝沙箱）
  createPayOrder: (amount, subject, extra = {}) => post('/pay/create', { amount, subject, ...extra }),
  queryOrder: (orderNo) => get(`/pay/query/${orderNo}`),
  myOrders: () => get('/pay/orders'),
  cancelOrder: (orderNo) => post(`/pay/cancel/${orderNo}`),

  // 全局搜索（公开）
  globalSearch: (q) => get('/search?q=' + encodeURIComponent(q)),

  // 消息分组（公开？不，需登录）
  messageGrouped: () => get('/notification/grouped'),

  // 社区热门 / 推荐
  hotPosts: (type = '', limit = 30) => get(`/community/posts/hot?type=${type}&limit=${limit}`),
  recommendPosts: (city = '', limit = 20) => get(`/community/posts/recommend?city=${encodeURIComponent(city)}&limit=${limit}`),

  // OCR（腾讯云）
  ocrHealthRecord: (imageUrl) => post('/pet/ocr/health', { imageUrl }),

  // AI 问诊（需登录）：多轮会话 + 图片问诊
  consultModels: () => get('/consult/models'),
  createConsultSession: (title) => post('/consult/sessions', { title }),
  consultSessions: () => get('/consult/sessions'),
  consultMessages: (id) => get(`/consult/sessions/${id}/messages`),
  sendConsultMessage: (id, content, model) => post(`/consult/sessions/${id}/messages`, { content, model }),

  /**
   * AI 问诊 SSE 流式调用（fetch + ReadableStream，可带 Authorization）
   * @param id 会话 id
   * @param content 用户消息
   * @param model 模型 id
   * @param handlers { onChunk, onDone, onError }
   * @returns { close: () => void } 调用方在卸载/中断时关闭连接
   */
  streamConsultMessage: async (id, content, model, handlers = {}) => {
    const token = localStorage.getItem('token')
    const params = new URLSearchParams({ content })
    if (model) params.set('model', model)
    const url = `/api/consult/sessions/${id}/stream?${params.toString()}`
    const ac = new AbortController()
    try {
      const resp = await fetch(url, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: ac.signal
      })
      if (!resp.ok || !resp.body) {
        handlers.onError?.(`请求失败 (${resp.status})`)
        return { close: () => {} }
      }
      const reader = resp.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buf = ''
      const pump = async () => {
        try {
          while (true) {
            const { value, done } = await reader.read()
            if (done) break
            buf += decoder.decode(value, { stream: true })
            // SSE 格式："event: message\ndata: <text>\n\n"
            let idx
            while ((idx = buf.indexOf('\n\n')) >= 0) {
              const evt = buf.slice(0, idx); buf = buf.slice(idx + 2)
              const lines = evt.split('\n')
              let evName = 'message', data = ''
              for (const line of lines) {
                if (line.startsWith('event:')) evName = line.slice(6).trim()
                else if (line.startsWith('data:')) data += line.slice(5).trim()
              }
              if (evName === 'message') handlers.onChunk?.(data)
              else if (evName === 'done') handlers.onDone?.(data)
              else if (evName === 'error') handlers.onError?.(data)
            }
          }
        } catch (e) {
          if (e.name !== 'AbortError') handlers.onError?.(e.message || '读取失败')
        }
      }
      pump()
      return { close: () => ac.abort() }
    } catch (e) {
      if (e.name !== 'AbortError') handlers.onError?.(e.message || '网络错误')
      return { close: () => {} }
    }
  },
  imageConsult: (file, content, model) => {
    const form = new FormData()
    form.append('file', file)
    if (content) form.append('content', content)
    if (model) form.append('model', model)
    return fetch(BASE + '/consult/image', {
      method: 'POST',
      headers: { authorization: token() },
      body: form
    }).then(r => r.json().catch(() => ({ code: r.status, msg: r.statusText })))
  },

  // AI 问诊知识库
  knowledgeList: (category) => get('/knowledge' + (category ? `?category=${category}` : '')),
  knowledgeDetail: (id) => get(`/knowledge/${id}`),
  knowledgeCreate: (entry) => post('/knowledge', entry),
  knowledgeUpdate: (id, entry) => put(`/knowledge/${id}`, entry),
  knowledgeDelete: (id) => del(`/knowledge/${id}`),

  // 在线医生（真实数据）
  doctorList: (dept, onlineOnly) => {
    const q = new URLSearchParams()
    if (dept) q.set('dept', dept)
    if (onlineOnly) q.set('onlineOnly', 'true')
    return get('/doctor' + (q.toString() ? '?' + q.toString() : ''))
  },
  doctorDetail: (id) => get(`/doctor/${id}`),
  doctorDepartments: () => get('/doctor/departments'),

  // 预约
  bookedSlots: (doctorId, date) => get(`/appointment/booked-slots?doctorId=${doctorId}&date=${date}`),
  createAppointment: (body) => post('/appointment', body),
  myAppointments: () => get('/appointment/mine'),
  cancelAppointment: (id) => post(`/appointment/${id}/cancel`),
  payAppointment: (id) => post(`/appointment/${id}/pay`),
  completeAppointment: (id) => post(`/appointment/${id}/complete`),

  // 宠物保险
  insurancePlans: () => get('/insurance/plans'),
  insurancePlanDetail: (id) => get(`/insurance/plans/${id}`),

  // 同城服务（fallback：当高德 API 不可用时使用后端数据）
  serviceStores: (category, sort) => {
    const q = new URLSearchParams()
    if (category && category !== '全部') q.set('category', category)
    if (sort) q.set('sort', sort)
    return get('/service/stores' + (q.toString() ? '?' + q.toString() : ''))
  },
  serviceStoreDetail: (id) => get(`/service/stores/${id}`),
  serviceCategories: () => get('/service/categories'),

  // 高德真实门店 POI（用于卡片 / 详情展示实拍照片）
  amapSearch: (type, city, limit) => {
    const q = new URLSearchParams()
    if (type) q.set('type', type)
    if (city) q.set('city', city)
    if (limit) q.set('limit', String(limit))
    return get('/service/amap-search' + (q.toString() ? '?' + q.toString() : ''))
  },
  amapPhotos: (type, city, count) => {
    const q = new URLSearchParams()
    if (type) q.set('type', type)
    if (city) q.set('city', city)
    if (count) q.set('count', String(count))
    return get('/service/amap-photos' + (q.toString() ? '?' + q.toString() : ''))
  },
  amapAround: (type, lng, lat, radius, limit) => {
    const q = new URLSearchParams()
    if (type) q.set('type', type)
    q.set('lng', String(lng))
    q.set('lat', String(lat))
    if (radius) q.set('radius', String(radius))
    if (limit) q.set('limit', String(limit))
    return get('/service/amap-around' + (q.toString() ? '?' + q.toString() : ''))
  },

  // 同城服务（新模型）：6 类服务 × 7 宠物类型，每个服务对应独立后端跳转链接
  serviceTypes: () => get('/service/types'),
  servicePetTypes: () => get('/service/pet-types'),
  serviceServices: (params = {}) => {
    const q = new URLSearchParams()
    if (params.type && params.type !== '全部') q.set('type', params.type)
    if (params.pet && params.pet !== '全部') q.set('pet', params.pet)
    if (params.mode) q.set('mode', params.mode)
    if (params.sort) q.set('sort', params.sort)
    return get('/service/services' + (q.toString() ? '?' + q.toString() : ''))
  },
  serviceServiceDetail: (id) => get(`/service/services/${id}`),
  serviceTypeList: (type, pet) => {
    const q = new URLSearchParams()
    if (pet && pet !== '全部') q.set('pet', pet)
    return get(`/service/${type}/list` + (q.toString() ? '?' + q.toString() : ''))
  },
  // 下单：每个类型对应独立后端 endpoint（/service/{type}/book/{id}）
  serviceBook: (type, id, body) => post(`/service/${type}/book/${id}`, body),
  serviceOrders: () => get('/service/orders/mine')
}

// ---- 智能客服 SSE 流式（EventSource，免登录）----
// 返回一个可取消的控制器，逐 chunk 回调
export function chatStream(msg, onChunk, onDone, onError) {
  const es = new EventSource(`${BASE}/customer-service/stream?msg=${encodeURIComponent(msg)}`)
  es.onmessage = (e) => {
    if (e.data === '[DONE]') {
      es.close()
      onDone && onDone()
      return
    }
    onChunk && onChunk(e.data)
  }
  es.onerror = (e) => {
    es.close()
    onError && onError(e)
  }
  return () => es.close()
}
