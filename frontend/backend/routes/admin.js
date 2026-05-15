const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

// ─── GET /api/admin/stats ─────────────────────────────────────────────────
router.get('/stats', protect, authorize('admin'), async (req, res) => {
    const [totalUsers, totalPatients, totalDoctors, auditCount] = await Promise.all([
        User.countDocuments(),
        Patient.countDocuments(),
        Doctor.countDocuments(),
        AuditLog.countDocuments(),
    ]);

    const triageDist = await require('../models/Patient').aggregate([
        { $group: { _id: '$triageStatus', count: { $sum: 1 } } },
    ]);

    res.json({
        success: true,
        data: { totalUsers, totalPatients, totalDoctors, auditCount, triageDistribution: triageDist },
    });
});

// ─── GET /api/admin/audit-logs ────────────────────────────────────────────
router.get('/audit-logs', protect, authorize('admin'), async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const logs = await AuditLog.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('actor', 'firstName lastName role');

    const total = await AuditLog.countDocuments();
    res.json({ success: true, data: logs, total, page, pages: Math.ceil(total / limit) });
});

// ─── PATCH /api/admin/users/:id/deactivate ───────────────────────────────
router.patch('/users/:id/deactivate', protect, authorize('admin'), async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: 'User deactivated.', data: { id: user._id, isActive: user.isActive } });
});

// ─── GET /api/admin/users ─────────────────────────────────────────────────
router.get('/users', protect, authorize('admin'), async (req, res) => {
    const { role, page = 1, limit = 30 } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
    const total = await User.countDocuments(filter);
    res.json({ success: true, data: users, total });
});

module.exports = router;
