import request from "@/utils/request";

// 查询预警结果，关联实时数据，主删除从同步删除列表
export function listAnalysisResult(query) {
  return request({
    url: "/kms/analysisResult/list",
    method: "get",
    params: query,
  });
}

// 查询预警结果，关联实时数据，主删除从同步删除详细
export function getAnalysisResult(id) {
  return request({
    url: "/kms/analysisResult/" + id,
    method: "get",
  });
}

// 新增预警结果，关联实时数据，主删除从同步删除
export function addAnalysisResult(data) {
  return request({
    url: "/kms/analysisResult",
    method: "post",
    data: data,
  });
}

// 修改预警结果，关联实时数据，主删除从同步删除
export function updateAnalysisResult(data) {
  return request({
    url: "/kms/analysisResult",
    method: "put",
    data: data,
  });
}

// 删除预警结果，关联实时数据，主删除从同步删除
export function delAnalysisResult(id) {
  return request({
    url: "/kms/analysisResult/" + id,
    method: "delete",
  });
}

// 处理预警（标记为已处理）
export function handleAnalysisResult(data) {
  return request({
    url: "/kms/analysisResult/handle",
    method: "post",
    data: data,
  });
}
