const AuditLog = require('../models/AuditLog');

/**
 * Factory: creates an audit-logging middleware for a given action name
 * Usage: router.post('/override', protect, audit('OVERRIDE_TRIAGE'), controller)
 */
const audit = (action, resourceType) => {
    return async (req, res, next) => {
        // Capture original json() to intercept response
        const originalJson = res.json.bind(res);
        res.json = async (body) => {
            const isSuccess = res.statusCode < 400;
            try {
                await AuditLog.create({
                    actor: req.user?._id,
                    actorRole: req.user?.role,
                    action,
                    resource: resourceType,
                    resourceId: req.params?.id || body?.data?._id,
                    targetUser: req.params?.patientId || req.body?.patientId,
                    meta: {
                        method: req.method,
                        path: req.originalUrl,
                        body: sanitizeBody(req.body),
                    },
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    status: isSuccess ? 'success' : 'failure',
                    errorMessage: isSuccess ? undefined : body?.message,
                });
            } catch (logErr) {
                console.error('Audit log failed:', logErr.message);
            }
            return originalJson(body);
        };
        next();
    };
};

// Strip sensitive fields from audit payload
function sanitizeBody(body) {
    if (!body) return {};
    const { password, confirmPassword, token, refreshToken, ...safe } = body;
    return safe;
}

module.exports = audit;
