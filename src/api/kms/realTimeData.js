import request from '@/utils/request'

// 查询关键指标实时数据列表
export function listRealTimeData(query) {
  return request({
    url: '/kms/realTimeData/list',
    method: 'get',
    params: query
  })
}

// 查询关键指标实时数据详细
export function getRealTimeData(id) {
  return request({
    url: '/kms/realTimeData/' + id,
    method: 'get'
  })
}

// 新增关键指标实时数据
export function addRealTimeData(data) {
  return request({
    url: '/kms/realTimeData',
    method: 'post',
    data: data
  })
}

// 修改关键指标实时数据
export function updateRealTimeData(data) {
  return request({
    url: '/kms/realTimeData',
    method: 'put',
    data: data
  })
}

// 删除关键指标实时数据
export function delRealTimeData(id) {
  return request({
    url: '/kms/realTimeData/' + id,
    method: 'delete'
  })
}
