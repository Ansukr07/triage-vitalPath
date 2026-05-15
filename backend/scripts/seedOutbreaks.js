require('dotenv').config();
const mongoose = require('mongoose');
const OutbreakIncident = require('../models/OutbreakIncident');

const MOCK_DATA = [
    // Indiranagar Cluster (Dengue)
    ...Array.from({ length: 15 }, () => ({
        disease: 'Dengue',
        location: {
            type: 'Point',
            coordinates: [
                77.6408 + (Math.random() - 0.5) * 0.01, // Longitude +/-
                12.9784 + (Math.random() - 0.5) * 0.01  // Latitude +/-
            ]
        },
        zone: 'Indiranagar',
        severity: Math.random() > 0.7 ? 'high' : 'medium',
        status: 'active',
        reportedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
    })),
    // Koramangala Cluster (Typhoid)
    ...Array.from({ length: 12 }, () => ({
        disease: 'Typhoid',
        location: {
            type: 'Point',
            coordinates: [
                77.6245 + (Math.random() - 0.5) * 0.015,
                12.9352 + (Math.random() - 0.5) * 0.015
            ]
        },
        zone: 'Koramangala',
        severity: Math.random() > 0.8 ? 'critical' : 'medium',
        status: 'active',
        reportedAt: new Date(Date.now() - Math.floor(Math.random() * 15) * 24 * 60 * 60 * 1000)
    })),
    // Whitefield Cluster (Chikungunya)
    ...Array.from({ length: 20 }, () => ({
        disease: 'Chikungunya',
        location: {
            type: 'Point',
            coordinates: [
                77.7499 + (Math.random() - 0.5) * 0.02,
                12.9698 + (Math.random() - 0.5) * 0.02
            ]
        },
        zone: 'Whitefield',
        severity: Math.random() > 0.6 ? 'high' : 'low',
        status: 'active',
        reportedAt: new Date(Date.now() - Math.floor(Math.random() * 20) * 24 * 60 * 60 * 1000)
    })),
     // Marathahalli Cluster (Dengue)
     ...Array.from({ length: 8 }, () => ({
        disease: 'Dengue',
        location: {
            type: 'Point',
            coordinates: [
                77.6984 + (Math.random() - 0.5) * 0.01,
                12.9569 + (Math.random() - 0.5) * 0.01
            ]
        },
        zone: 'Marathahalli',
        severity: 'medium',
        status: 'resolved',
        reportedAt: new Date(Date.now() - Math.floor(Math.random() * 45 + 15) * 24 * 60 * 60 * 1000),
        resolvedAt: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000)
    }))
];

const seedData = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI, { dbName: 'medic_db' });
        console.log('Connected to MongoDB.');

        console.log('Clearing old outbreak data...');
        await OutbreakIncident.deleteMany();

        console.log('Inserting new outbreak data...');
        await OutbreakIncident.insertMany(MOCK_DATA);

        console.log('✅ Outbreak data seeded successfully!');
    } catch (error) {
        console.error('❌ Error seeding data:', error);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
};

seedData();
