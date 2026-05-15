import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import HeatmapLayer from '../../components/EHR/HeatmapLayer';
import {
    Activity, MapPin, AlertCircle, AlertTriangle, ChevronDown, Download, Plus, Minus, Layers
} from 'lucide-react';
import './OutbreakDashboard.css';

// Fix for default Leaflet marker icons not resolving in some bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createCustomIcon = (color) => {
    return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
    });
};

const icons = {
    critical: createCustomIcon('#ef4444'),
    high: createCustomIcon('#f97316'),
    medium: createCustomIcon('#eab308'),
    low: createCustomIcon('#3b82f6')
};

const center = [12.9716, 77.5946];

function MapController({ zoomIn, zoomOut }) {
    const map = useMap();
    useEffect(() => {
        if (zoomIn > 0) map.zoomIn();
    }, [zoomIn, map]);
    useEffect(() => {
        if (zoomOut > 0) map.zoomOut();
    }, [zoomOut, map]);
    return null;
}

export default function OutbreakDashboard() {
    const [incidents, setIncidents] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Stages');
    const [selectedZone, setSelectedZone] = useState('All Regions');
    const [zoomInTick, setZoomInTick] = useState(0);
    const [zoomOutTick, setZoomOutTick] = useState(0);

    useEffect(() => {
        fetchData();
    }, [selectedZone]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const queryParams = selectedZone !== 'All Regions' ? `?zone=${selectedZone}` : '';
            const [outbreakRes, statsRes] = await Promise.all([
                api.get(`/outbreaks${queryParams}`),
                api.get(`/outbreaks/stats${queryParams}`)
            ]);
            setIncidents(outbreakRes.data.data);
            setStats(statsRes.data.data);
        } catch (error) {
            console.error('Failed to fetch outbreak data', error);
        } finally {
            setLoading(false);
        }
    };

    const heatmapData = useMemo(() => {
        if (!incidents.length) return [];
        return incidents.filter(i => i.status === 'active').map(inc => ({
            lat: inc.location.coordinates[1],
            lng: inc.location.coordinates[0],
            intensity: inc.severity === 'critical' ? 1.0 : inc.severity === 'high' ? 0.8 : 0.5
        }));
    }, [incidents]);

    const handleZoomIn = () => setZoomInTick(t => t + 1);
    const handleZoomOut = () => setZoomOutTick(t => t + 1);

    const panelVariants = {
        hidden: { opacity: 0, x: 50 },
        visible: (custom) => ({
            opacity: 1, 
            x: 0,
            transition: { delay: custom * 0.1, duration: 0.4, ease: "easeOut" }
        })
    };

    // Derived stats for UI
    const totalActive = stats?.totalActive || 0;
    const totalHistorical = stats?.totalHistorical || 0;
    const totalResolved = stats?.totalResolved || 0;
    const activePercent = totalHistorical > 0 ? Math.round((totalActive / totalHistorical) * 100) : 0;
    
    const highSeverityCount = (stats?.severityStats.find(s => s._id === 'high')?.count || 0) + 
                              (stats?.severityStats.find(s => s._id === 'critical')?.count || 0);
    const highSeverityPercent = totalActive > 0 ? Math.round((highSeverityCount / totalActive) * 100) : 0;

    const resolvedPercent = totalHistorical > 0 ? Math.round((totalResolved / totalHistorical) * 100) : 0;

    // Top Disease logic
    const topDisease = stats?.diseaseStats[0]?._id || 'None';
    const topDiseaseCount = stats?.diseaseStats[0]?.count || 0;
    const topDiseasePercent = totalActive > 0 ? Math.round((topDiseaseCount / totalActive) * 100) : 0;

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            <Sidebar />
            
            <div className="outbreak-wrapper">
                
                {/* Left Sidebar Overlay */}
                <div className="outbreak-left-sidebar" style={{ zIndex: 1000 }}>
                    <div className="brand-header">
                        <div className="brand-logo">
                            <Activity size={20} />
                        </div>
                        <div className="brand-title">VitalRadar</div>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>
                        Timeline ({selectedZone})
                    </div>

                    <div className="timeline-container">
                        {stats?.trendStats?.slice(-10).map((day, idx) => (
                            <motion.div 
                                key={idx} 
                                className="timeline-item"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <div className="timeline-dot"></div>
                                <div className="timeline-content">
                                    <div className="timeline-date">{new Date(day._id).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{day.count} New Cases</div>
                                    <div className="timeline-bar">
                                        <div className="timeline-bar-fill" style={{ width: `${Math.min(day.count * 10, 100)}%` }}></div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {(!stats?.trendStats || stats.trendStats.length === 0) && (
                            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No recent cases.</div>
                        )}
                    </div>

                    <button className="btn btn-outline" style={{ marginTop: '20px', width: '100%', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <Download size={16} /> Export PDF
                    </button>
                </div>

                {/* Map Area */}
                <div className="map-container" style={{ zIndex: 1 }}>
                    <div className="map-controls" style={{ zIndex: 1000 }}>
                        <button className="map-control-btn" onClick={handleZoomIn}><Plus size={20}/></button>
                        <button className="map-control-btn" onClick={handleZoomOut}><Minus size={20}/></button>
                        <button className="map-control-btn" style={{ marginTop: '16px' }} onClick={() => setSelectedZone('All Regions')} title="Reset Map"><Layers size={20}/></button>
                    </div>

                    <MapContainer 
                        center={center} 
                        zoom={12} 
                        zoomControl={false}
                        style={{ width: '100%', height: '100%' }}
                    >
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            subdomains="abcd"
                            maxZoom={20}
                        />

                        <MapController zoomIn={zoomInTick} zoomOut={zoomOutTick} />

                        {heatmapData.length > 0 && (
                            <HeatmapLayer 
                                data={heatmapData} 
                                options={{
                                    radius: 25,
                                    blur: 15,
                                    maxZoom: 14,
                                    gradient: {
                                        0.4: 'blue',
                                        0.6: 'cyan',
                                        0.7: 'lime',
                                        0.8: 'yellow',
                                        1.0: 'red'
                                    }
                                }}
                            />
                        )}

                        {incidents.filter(i => i.status === 'active').map(inc => (
                            <Marker 
                                key={inc._id}
                                position={[inc.location.coordinates[1], inc.location.coordinates[0]]}
                                icon={icons[inc.severity] || icons.medium}
                                eventHandlers={{
                                    click: () => {
                                        if(inc.zone && inc.zone !== 'Unknown') {
                                            setSelectedZone(inc.zone);
                                        }
                                    },
                                }}
                            >
                                <Popup className="glassmorphic-popup">
                                    <div style={{ padding: '4px', minWidth: '180px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                            <AlertCircle size={14} color={inc.severity === 'critical' ? '#ef4444' : '#f97316'} />
                                            <strong style={{ fontSize: '14px', textTransform: 'capitalize' }}>{inc.disease}</strong>
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                                            <strong>Severity:</strong> <span style={{ textTransform: 'uppercase', color: inc.severity === 'critical' ? '#ef4444' : '#f97316' }}>{inc.severity}</span>
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                                            <strong>Zone:</strong> {inc.zone}
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>

                {/* Right Panels Overlay */}
                <div className="outbreak-right-panels" style={{ zIndex: 1000 }}>
                    
                    <motion.div 
                        className="outbreak-tabs"
                        style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <select 
                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', outline: 'none', background: 'white', color: '#1e293b', fontWeight: 600, cursor: 'pointer' }}
                            value={selectedZone}
                            onChange={(e) => setSelectedZone(e.target.value)}
                        >
                            <option value="All Regions">All Regions</option>
                            {stats?.availableZones?.map(z => (
                                <option key={z} value={z}>{z}</option>
                            ))}
                        </select>
                        
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <div className={`outbreak-tab ${activeTab === 'Stages' ? 'active' : ''}`} onClick={() => setActiveTab('Stages')}>Stages</div>
                            <div className={`outbreak-tab ${activeTab === 'Transitions' ? 'active' : ''}`} onClick={() => setActiveTab('Transitions')}>Transitions</div>
                        </div>
                    </motion.div>

                    <motion.div custom={1} initial="hidden" animate="visible" variants={panelVariants} className="outbreak-panel">
                        <div className="panel-header">
                            <div className="panel-title">
                                <div className="panel-icon icon-blue"><AlertCircle size={16} /></div>
                                Active Clusters
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{selectedZone}</span>
                        </div>
                        <div className="stats-grid">
                            <div className="stat-item">
                                <div className="stat-value">{totalActive}</div>
                                <div className="stat-label">Active</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value">{activePercent}%</div>
                                <div className="stat-label">Of Whole</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value">{stats?.inToday || 0}</div>
                                <div className="stat-label">In Today</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value">{stats?.outToday || 0}</div>
                                <div className="stat-label">Out Today</div>
                            </div>
                        </div>
                        
                        <div style={{ borderTop: '1px solid #e2e8f0', margin: '16px 0' }}></div>
                        
                        <div className="progress-section">
                            <div className="progress-header">
                                <span>High Risk ({topDisease})</span>
                                <span>{topDiseasePercent}%</span>
                            </div>
                            <div className="progress-track">
                                <div className="progress-fill fill-blue" style={{ width: `${topDiseasePercent}%` }}></div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div custom={2} initial="hidden" animate="visible" variants={panelVariants} className="outbreak-panel">
                        <div className="panel-header">
                            <div className="panel-title">
                                <div className="panel-icon icon-orange"><AlertTriangle size={16} /></div>
                                High Severity Zones
                            </div>
                        </div>
                        <div className="stats-grid">
                            <div className="stat-item">
                                <div className="stat-value">{highSeverityCount}</div>
                                <div className="stat-label">Severe</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value">{highSeverityPercent}%</div>
                                <div className="stat-label">Of Active</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value">{stats?.severityStats.find(s => s._id === 'critical')?.count || 0}</div>
                                <div className="stat-label">Critical</div>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #e2e8f0', margin: '16px 0' }}></div>

                        <div className="progress-section">
                            <div className="progress-header">
                                <span>Critical</span>
                                <span>{stats?.severityStats.find(d => d._id === 'critical')?.count || 0} Cases</span>
                            </div>
                            <div className="progress-track">
                                <div className="progress-fill fill-orange" style={{ width: `${totalActive > 0 ? ((stats?.severityStats.find(d => d._id === 'critical')?.count || 0) / totalActive) * 100 : 0}%` }}></div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div custom={3} initial="hidden" animate="visible" variants={panelVariants} className="outbreak-panel">
                        <div className="panel-header">
                            <div className="panel-title">
                                <div className="panel-icon icon-green"><MapPin size={16} /></div>
                                Resolved Areas
                            </div>
                        </div>
                        <div className="stats-grid">
                            <div className="stat-item">
                                <div className="stat-value">{totalResolved}</div>
                                <div className="stat-label">Resolved</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value">{resolvedPercent}%</div>
                                <div className="stat-label">Of Whole</div>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </div>
    );
}
