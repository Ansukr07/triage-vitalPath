const mongoose = require('mongoose');

const outbreakIncidentSchema = new mongoose.Schema({
    disease: {
        type: String,
        required: true,
        enum: ['Dengue', 'Malaria', 'Typhoid', 'Chikungunya', 'Cholera', 'COVID-19']
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    zone: {
        type: String,
        default: 'Unknown'
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['active', 'resolved'],
        default: 'active'
    },
    reportedAt: {
        type: Date,
        default: Date.now
    },
    resolvedAt: {
        type: Date
    }
}, { timestamps: true });

// Index for geospatial queries
outbreakIncidentSchema.index({ location: '2dsphere' });
outbreakIncidentSchema.index({ reportedAt: -1 });

const OutbreakIncident = mongoose.model('OutbreakIncident', outbreakIncidentSchema);

module.exports = OutbreakIncident;
