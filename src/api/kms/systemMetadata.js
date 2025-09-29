import request from '@/utils/request'

// 查询系统元数据列表
export function listSystemMetadata(query) {
  return request({
    url: '/kms/systemMetadata/list',
    method: 'get',
    params: query
  })
}

// 查询系统元数据详细
export function getSystemMetadata(id) {
  return request({
    url: '/kms/systemMetadata/' + id,
    method: 'get'
  })
}

// 新增系统元数据
export function addSystemMetadata(data) {
  return request({
    url: '/kms/systemMetadata',
    method: 'post',
    data: data
  })
}

// 修改系统元数据
export function updateSystemMetadata(data) {
  return request({
    url: '/kms/systemMetadata',
    method: 'put',
    data: data
  })
}

// 删除系统元数据
export function delSystemMetadata(id) {
  return request({
    url: '/kms/systemMetadata/' + id,
    method: 'delete'
  })
}
