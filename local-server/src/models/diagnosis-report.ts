/** 诊断报告数据模型 */
export interface DiagnosisReportModel {
  id: string;
  user_id: string;
  article_count: number;
  avg_read_count: number;
  report_text: string;
  created_at: string;
}

/** 创建诊断报告参数 */
export interface CreateDiagnosisReportParams {
  id: string;
  user_id: string;
  article_count: number;
  avg_read_count: number;
  report_text: string;
}
