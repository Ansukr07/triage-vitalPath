const express = require('express');
const OutbreakIncident = require('../models/OutbreakIncident');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Get all outbreaks (with optional filtering)
router.get('/', protect, async (req, res) => {
    try {
        const { disease, status, days, zone } = req.query;
        let query = {};
        
        if (disease) query.disease = disease;
        if (status) query.status = status;
        if (zone && zone !== 'All Regions') query.zone = zone;
        
        if (days) {
            const date = new Date();
            date.setDate(date.getDate() - parseInt(days));
            query.reportedAt = { $gte: date };
        }

        const incidents = await OutbreakIncident.find(query).sort({ reportedAt: -1 });

        res.status(200).json({
            status: 'success',
            results: incidents.length,
            data: incidents
        });
    } catch (error) {
        console.error('Error fetching outbreaks:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch outbreaks' });
    }
});

// Get outbreak statistics
router.get('/stats', protect, async (req, res) => {
    try {
        const { zone } = req.query;
        let matchQuery = {};
        if (zone && zone !== 'All Regions') matchQuery.zone = zone;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        // Calculate overall totals for the query
        const totalHistorical = await OutbreakIncident.countDocuments(matchQuery);
        const totalResolved = await OutbreakIncident.countDocuments({ ...matchQuery, status: 'resolved' });

        // Calculate "In Today" and "Out Today"
        const inToday = await OutbreakIncident.countDocuments({ ...matchQuery, reportedAt: { $gte: twentyFourHoursAgo } });
        const outToday = await OutbreakIncident.countDocuments({ ...matchQuery, status: 'resolved', resolvedAt: { $gte: twentyFourHoursAgo } });

        // Aggregate active cases by disease
        const diseaseStats = await OutbreakIncident.aggregate([
            { $match: { ...matchQuery, status: 'active' } },
            { $group: { _id: '$disease', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Aggregate severity counts
        const severityStats = await OutbreakIncident.aggregate([
            { $match: { ...matchQuery, status: 'active' } },
            { $group: { _id: '$severity', count: { $sum: 1 } } }
        ]);

        // Trend over last 30 days (group by day)
        const trendStats = await OutbreakIncident.aggregate([
            { $match: { ...matchQuery, reportedAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$reportedAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Get unique zones
        const availableZones = await OutbreakIncident.distinct('zone');

        res.status(200).json({
            status: 'success',
            data: {
                diseaseStats,
                severityStats,
                trendStats,
                totalHistorical,
                totalResolved,
                inToday,
                outToday,
                availableZones: availableZones.filter(Boolean),
                totalActive: diseaseStats.reduce((acc, curr) => acc + curr.count, 0)
            }
        });
    } catch (error) {
        console.error('Error fetching outbreak stats:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch outbreak statistics' });
    }
});

module.exports = router;
