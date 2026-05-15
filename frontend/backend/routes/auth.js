const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const audit = require('../middleware/audit');

// Helper: generate tokens
const signAccess = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });

const signRefresh = (id) =>
    jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });

// ─── POST /api/auth/register ───────────────────────────────────────────────
router.post('/register', audit('USER_REGISTER', 'User'), async (req, res) => {
    const { firstName, lastName, email, password, role, phone, licenseNumber, dateOfBirth, gender, specialization } = req.body;

    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
        return res.status(409).json({ success: false, message: 'Email already in use.' });
    }

    const user = await User.create({ firstName, lastName, email, password, role: role || 'patient', phone });

    // Create role-specific profile
    if (user.role === 'patient') {
        await Patient.create({
            user: user._id,
            dateOfBirth,
            gender
        });
    } else if (user.role === 'doctor') {
        const license = licenseNumber || `LIC-${Date.now()}`;
        await Doctor.create({
            user: user._id,
            licenseNumber: license,
            specializations: specialization ? [specialization] : []
        });
    }

    const accessToken = signAccess(user._id);
    const refreshToken = signRefresh(user._id);

    // Store refresh token
    await User.findByIdAndUpdate(user._id, { refreshToken });

    res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        data: {
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
            },
        },
    });
});

// ─── POST /api/auth/login ──────────────────────────────────────────────────
router.post('/login', audit('USER_LOGIN', 'User'), async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email }).select('+password +refreshToken');

    if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    }

    const accessToken = signAccess(user._id);
    const refreshToken = signRefresh(user._id);

    await User.findByIdAndUpdate(user._id, { refreshToken, lastLogin: new Date() });

    res.json({
        success: true,
        data: {
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
            },
        },
    });
});

// ─── POST /api/auth/refresh ────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(401).json({ success: false, message: 'Refresh token required.' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
        return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }

    const accessToken = signAccess(user._id);
    res.json({ success: true, data: { accessToken } });
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────
router.post('/logout', async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
        } catch { /* ignore */ }
    }
    res.json({ success: true, message: 'Logged out successfully.' });
});

module.exports = router;
