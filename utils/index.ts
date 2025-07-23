import { EvaluationType } from "@/types";


export  function  ConvertEvaluationTypeToVietNamese(type: EvaluationType): string {
  switch (type) {
    case EvaluationType.REVIEW:
      return 'Đánh giá';
    case EvaluationType.APPROVAL:
      return 'Phê duyệt';
    case EvaluationType.REJECTION:
      return 'Từ chối';
    default:
      return '';
  }
}