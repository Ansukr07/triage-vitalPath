const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

// Load env vars
dotenv.config();

const seedDoctors = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: 'medic_db'
        });
        console.log('MongoDB Connected');

        // Check if doctors already exist
        const existingDocs = await Doctor.countDocuments();
        if (existingDocs > 0) {
            console.log(`Found ${existingDocs} doctors. Clearing them for a fresh seed...`);
            // Find doctor users to delete them too
            const doctors = await Doctor.find();
            for (let d of doctors) {
                await User.findByIdAndDelete(d.user);
            }
            await Doctor.deleteMany();
        }

        const password = await bcrypt.hash('doctor123', 10);

        const doctorData = [
            {
                firstName: 'Sarah',
                lastName: 'Jenkins',
                email: 'sarah.jenkins@vitalpath.com',
                phone: '+1234567890',
                role: 'doctor',
                password,
                isVerified: true,
                docDetails: {
                    licenseNumber: 'MD-100234',
                    specializations: ['Cardiology', 'Internal Medicine'],
                    qualifications: ['MD', 'FACC'],
                    hospitalAffiliation: 'VitalPath Heart Institute',
                    department: 'Cardiology',
                    yearsOfExperience: 14,
                    availability: {
                        days: ['Mon', 'Wed', 'Fri'],
                        startTime: '09:00',
                        endTime: '15:00',
                    },
                    bio: 'Dr. Jenkins specializes in cardiovascular health and preventive medicine.',
                    isVerified: true
                }
            },
            {
                firstName: 'David',
                lastName: 'Chen',
                email: 'david.chen@vitalpath.com',
                phone: '+1234567891',
                role: 'doctor',
                password,
                isVerified: true,
                docDetails: {
                    licenseNumber: 'MD-200567',
                    specializations: ['General Practice', 'Family Medicine'],
                    qualifications: ['MD', 'FAAFP'],
                    hospitalAffiliation: 'VitalPath General Clinic',
                    department: 'Primary Care',
                    yearsOfExperience: 8,
                    availability: {
                        days: ['Mon', 'Tue', 'Thu', 'Fri'],
                        startTime: '08:00',
                        endTime: '17:00',
                    },
                    bio: 'Dr. Chen focuses on comprehensive family care and holistic wellness.',
                    isVerified: true
                }
            },
            {
                firstName: 'Elena',
                lastName: 'Rodriguez',
                email: 'elena.rodriguez@vitalpath.com',
                phone: '+1234567892',
                role: 'doctor',
                password,
                isVerified: true,
                docDetails: {
                    licenseNumber: 'MD-300891',
                    specializations: ['Neurology'],
                    qualifications: ['MD', 'Ph.D'],
                    hospitalAffiliation: 'VitalPath Brain Center',
                    department: 'Neurology',
                    yearsOfExperience: 20,
                    availability: {
                        days: ['Tue', 'Wed', 'Sat'],
                        startTime: '10:00',
                        endTime: '18:00',
                    },
                    bio: 'Dr. Rodriguez is a leading expert in neurological disorders and cognitive health.',
                    isVerified: true
                }
            }
        ];

        for (const doc of doctorData) {
            const { docDetails, ...userFields } = doc;
            const newUser = await User.create(userFields);
            
            await Doctor.create({
                user: newUser._id,
                ...docDetails
            });
            console.log(`Created doctor: Dr. ${doc.firstName} ${doc.lastName}`);
        }

        console.log('Seeding complete!');
        process.exit();
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seedDoctors();
