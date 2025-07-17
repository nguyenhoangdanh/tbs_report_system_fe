"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateUserRanking = calculateUserRanking;
exports.normalizeRankingDistribution = normalizeRankingDistribution;
function calculateUserRanking(completionRate) {
    if (completionRate >= 100) {
        return {
            rank: 'EXCELLENT',
            label: 'Xuất sắc',
            color: '#22c55e',
            bgColor: '#f0fdf4'
        };
    }
    else if (completionRate >= 95) {
        return {
            rank: 'GOOD',
            label: 'Tốt',
            color: '#3b82f6',
            bgColor: '#eff6ff'
        };
    }
    else if (completionRate >= 90) {
        return {
            rank: 'AVERAGE',
            label: 'Trung bình',
            color: '#f59e0b',
            bgColor: '#fffbeb'
        };
    }
    else if (completionRate >= 85) {
        return {
            rank: 'POOR',
            label: 'Yếu',
            color: '#f97316',
            bgColor: '#fff7ed'
        };
    }
    else {
        return {
            rank: 'FAIL',
            label: 'Kém',
            color: '#ef4444',
            bgColor: '#fef2f2'
        };
    }
}
function normalizeRankingDistribution(distribution) {
    const defaultRankItem = { count: 0, percentage: 0 };
    return {
        excellent: distribution?.excellent || defaultRankItem,
        good: distribution?.good || defaultRankItem,
        average: distribution?.average || defaultRankItem,
        poor: distribution?.poor || defaultRankItem,
        fail: distribution?.fail || defaultRankItem,
    };
}
//# sourceMappingURL=hierarchy.js.map