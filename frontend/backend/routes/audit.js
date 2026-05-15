/**
 * Audit Log Route — /api/audit
 * Admin-only access to system audit logs with filtering and pagination.
 */
const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

/**
 * GET /api/audit
 * Paginated, filterable audit log viewer (admin only)
 */
router.get('/', protect, authorize('admin'), async (req, res) => {
    const {
        action,
        actorRole,
        status,
        resource,
        dateFrom,
        dateTo,
        page = 1,
        limit = 25,
    } = req.query;

    const query = {};
    if (action) query.action = { $regex: action, $options: 'i' };
    if (actorRole) query.actorRole = actorRole;
    if (status) query.status = status;
    if (resource) query.resource = { $regex: resource, $options: 'i' };

    if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
        if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
        AuditLog.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('actor', 'firstName lastName email role')
            .populate('targetUser', 'firstName lastName email role')
            .lean(),
        AuditLog.countDocuments(query),
    ]);

    res.json({
        success: true,
        data: logs,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit)),
        },
    });
});

/**
 * GET /api/audit/stats
 * Action type breakdown and actor stats (admin only)
 */
router.get('/stats', protect, authorize('admin'), async (req, res) => {
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [actionStats, roleStats, statusStats, recentActivity] = await Promise.all([
        AuditLog.aggregate([
            { $match: { createdAt: { $gte: since } } },
            { $group: { _id: '$action', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 15 },
        ]),
        AuditLog.aggregate([
            { $match: { createdAt: { $gte: since } } },
            { $group: { _id: '$actorRole', count: { $sum: 1 } } },
        ]),
        AuditLog.aggregate([
            { $match: { createdAt: { $gte: since } } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        // Daily activity for the last 7 days
        AuditLog.aggregate([
            { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]),
    ]);

    const total = await AuditLog.countDocuments({ createdAt: { $gte: since } });

    res.json({
        success: true,
        data: {
            total,
            days,
            actionStats,
            roleStats,
            statusStats,
            recentActivity,
        },
    });
});

/**
 * GET /api/audit/:id
 * Single audit log entry detail (admin only)
 */
router.get('/:id', protect, authorize('admin'), async (req, res) => {
    const log = await AuditLog.findById(req.params.id)
        .populate('actor', 'firstName lastName email role')
        .populate('targetUser', 'firstName lastName email role')
        .lean();

    if (!log) return res.status(404).json({ success: false, message: 'Audit log not found.' });

    res.json({ success: true, data: log });
});

module.exports = router;
