import Scan from '../models/Scan.js';

export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [
      totalScans,
      recentScans,
      avgScoreResult,
      severityAgg,
      riskAgg,
      trendAgg,
    ] = await Promise.all([
      Scan.countDocuments({ user: userId, status: 'completed' }),
      Scan.find({ user: userId, status: 'completed' })
        .select('-sourceCode -vulnerabilities')
        .sort({ createdAt: -1 })
        .limit(5),
      Scan.aggregate([
        { $match: { user: userId, status: 'completed' } },
        { $group: { _id: null, avg: { $avg: '$securityScore' } } },
      ]),
      Scan.aggregate([
        { $match: { user: userId, status: 'completed' } },
        {
          $group: {
            _id: null,
            critical: { $sum: '$summary.critical' },
            high: { $sum: '$summary.high' },
            medium: { $sum: '$summary.medium' },
            low: { $sum: '$summary.low' },
            informational: { $sum: '$summary.informational' },
          },
        },
      ]),
      Scan.aggregate([
        { $match: { user: userId, status: 'completed' } },
        { $group: { _id: '$riskLevel', count: { $sum: 1 } } },
      ]),
      Scan.aggregate([
        { $match: { user: userId, status: 'completed', createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            avgScore: { $avg: '$securityScore' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const avgScore = avgScoreResult[0]?.avg ? Math.round(avgScoreResult[0].avg) : 0;
    const severities = severityAgg[0] || { critical: 0, high: 0, medium: 0, low: 0, informational: 0 };
    delete severities._id;

    const riskDistribution = {};
    riskAgg.forEach(r => { riskDistribution[r._id] = r.count; });

    res.json({
      success: true,
      dashboard: {
        totalScans,
        averageScore: avgScore,
        severities,
        riskDistribution,
        recentScans,
        scanTrend: trendAgg,
      },
    });
  } catch (error) {
    next(error);
  }
};
