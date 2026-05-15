import express from 'express';
import OutbreakIncident from '../models/OutbreakIncident.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all outbreaks (with optional filtering)
router.get('/', protect, async (req, res) => {
    try {
        const { disease, status, days } = req.query;
        let query = {};
        
        if (disease) query.disease = disease;
        if (status) query.status = status;
        
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
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Aggregate active cases by disease
        const diseaseStats = await OutbreakIncident.aggregate([
            { $match: { status: 'active' } },
            { $group: { _id: '$disease', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Aggregate severity counts
        const severityStats = await OutbreakIncident.aggregate([
            { $match: { status: 'active' } },
            { $group: { _id: '$severity', count: { $sum: 1 } } }
        ]);

        // Trend over last 30 days (group by day)
        const trendStats = await OutbreakIncident.aggregate([
            { $match: { reportedAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$reportedAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                diseaseStats,
                severityStats,
                trendStats,
                totalActive: diseaseStats.reduce((acc, curr) => acc + curr.count, 0)
            }
        });
    } catch (error) {
        console.error('Error fetching outbreak stats:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch outbreak statistics' });
    }
});

export default router;
