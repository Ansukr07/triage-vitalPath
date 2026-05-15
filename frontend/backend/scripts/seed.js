/**
 * cogni:wave — Demo Data Seed Script
 * Run: node scripts/seed.js
 *
 * Creates:
 *   Patient  →  patient@demo.com  / Demo@1234
 *   Doctor   →  doctor@demo.com   / Demo@1234
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ── Inline minimal schemas so we don't depend on model imports ────────────────
const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: { type: String, unique: true },
    password: String,
    role: String,
    phone: String,
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

const patientSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    bloodType: String,
    gender: String,
    dateOfBirth: Date,
    allergies: [String],
    conditions: [String],
    medications: [String],
    triageStatus: { type: String, default: 'unknown' },
    emergencyContact: { name: String, phone: String, relationship: String },
    latestVitals: {
        heartRate: Number,
        bloodPressureSystolic: Number,
        bloodPressureDiastolic: Number,
        oxygenSaturation: Number,
        temperature: Number,
        respiratoryRate: Number,
    },
}, { timestamps: true });

const doctorSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    licenseNumber: String,
    specializations: [String],
    isVerified: { type: Boolean, default: true },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Patient = mongoose.models.Patient || mongoose.model('Patient', patientSchema);
const Doctor = mongoose.models.Doctor || mongoose.model('Doctor', doctorSchema);

// ── Seed ─────────────────────────────────────────────────────────────────────
async function seed() {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/medic_db';
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB:', MONGO_URI);

    const password = await bcrypt.hash('Demo@1234', 12);

    // ── Patient ────────────────────────────────────────────────────────────────
    let patientUser = await User.findOne({ email: 'patient@demo.com' });
    if (patientUser) {
        console.log('ℹ️  Demo patient already exists — skipping');
    } else {
        patientUser = await User.create({
            firstName: 'Priya',
            lastName: 'Sharma',
            email: 'patient@demo.com',
            password,
            role: 'patient',
            phone: '+91 98765 43210',
        });

        await Patient.create({
            user: patientUser._id,
            bloodType: 'O+',
            gender: 'female',
            dateOfBirth: new Date('1992-05-14'),
            allergies: ['Penicillin', 'Dust mites'],
            conditions: ['Type 2 Diabetes', 'Mild Hypertension'],
            medications: ['Metformin 500mg', 'Amlodipine 5mg'],
            triageStatus: 'moderate',
            emergencyContact: { name: 'Ramesh Sharma', phone: '+91 99887 76655', relationship: 'Husband' },
            latestVitals: {
                heartRate: 88,
                bloodPressureSystolic: 138,
                bloodPressureDiastolic: 88,
                oxygenSaturation: 97,
                temperature: 37.4,
                respiratoryRate: 18,
            },
        });

        console.log('🏥 Demo patient created  →  patient@demo.com');
    }

    // ── Doctor ─────────────────────────────────────────────────────────────────
    let doctorUser = await User.findOne({ email: 'doctor@demo.com' });
    if (doctorUser) {
        console.log('ℹ️  Demo doctor already exists — skipping');
    } else {
        doctorUser = await User.create({
            firstName: 'Arjun',
            lastName: 'Mehta',
            email: 'doctor@demo.com',
            password,
            role: 'doctor',
            phone: '+91 91234 56789',
        });

        await Doctor.create({
            user: doctorUser._id,
            licenseNumber: 'MH-2024-DM-00123',
            specializations: ['General Medicine', 'Diabetology'],
            isVerified: true,
        });

        console.log('👨‍⚕️ Demo doctor created   →  doctor@demo.com');
    }

    console.log('\n─────────────────────────────────────────────────');
    console.log('  Demo Credentials');
    console.log('─────────────────────────────────────────────────');
    console.log('  🏥 Patient  │  patient@demo.com  │  Demo@1234');
    console.log('  👨‍⚕️ Doctor   │  doctor@demo.com   │  Demo@1234');
    console.log('─────────────────────────────────────────────────\n');

    await mongoose.disconnect();
    process.exit(0);
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
});
