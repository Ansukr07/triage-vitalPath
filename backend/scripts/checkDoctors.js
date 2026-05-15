const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

dotenv.config();

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: 'medic_db' });
        const doctors = await Doctor.find().populate('user', 'firstName lastName email');
        console.log(`Found ${doctors.length} doctors in DB:`);
        doctors.forEach(d => {
            console.log(`- Dr. ${d.user?.firstName} ${d.user?.lastName} (Verified: ${d.isVerified})`);
        });
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

check();
