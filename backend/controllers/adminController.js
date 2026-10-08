import User from '../models/User.js';
import Scan from '../models/Scan.js';
import AuditLog from '../models/AuditLog.js';

export const getAdminStats = async (req, res, next) => {
  try {
    const [totalUsers, totalScans, recentUsers, recentScans, topUsers] = await Promise.all([
      User.countDocuments(),
      Scan.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(10).select('-password'),
      Scan.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name email').select('-sourceCode -vulnerabilities'),
      Scan.aggregate([
        { $group: { _id: '$user', count: { $sum: 1 }, avgScore: { $avg: '$securityScore' } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { 'user.name': 1, 'user.email': 1, count: 1, avgScore: 1 } },
      ]),
    ]);

    const apiUsage = {
      totalRequests: await AuditLog.countDocuments(),
      todayRequests: await AuditLog.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
    };

    res.json({
      success: true,
      stats: { totalUsers, totalScans, recentUsers, recentScans, topUsers, apiUsage },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const query = {};
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

export const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user._id.equals(req.user._id)) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate your own account' });
    }
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'Role updated', user });
  } catch (error) {
    next(error);
  }
};

export const getAllScans = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [scans, total] = await Promise.all([
      Scan.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user', 'name email')
        .select('-sourceCode -vulnerabilities'),
      Scan.countDocuments(),
    ]);
    res.json({ success: true, scans, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find().sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).populate('user', 'name email'),
      AuditLog.countDocuments(),
    ]);
    res.json({ success: true, logs, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    next(error);
  }
};
