const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const http = require('http');
const dgram = require('dgram');

const app = express();
const PORT = process.env.PORT || 3001; // Render provides PORT

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Set();
let telemetryData = {
    battery: { voltage: 0, current: 0, remaining: 0 },
    attitude: { roll: 0, pitch: 0, yaw: 0 },
    gps: { lat: 0, lon: 0, alt: 0, speed: 0, satellites: 0 },
    heartbeat: { flightMode: 'DISCONNECTED' },
    vfrHud: { groundspeed: 0, altitude: 0 }
};

class MAVLinkParser {
    constructor() {
        this.telemetryData = telemetryData;
    }

    parseBuffer(buffer) {
        if (!buffer || buffer.length < 8 || buffer[0] !== 0xFE) {
            return false;
        }

        try {
            const messageId = buffer[5];
            const payloadLength = buffer[1];
            const payloadStart = 6;

            console.log(`📨 MAVLink ID: ${messageId}, Len: ${payloadLength}`);

            switch(messageId) {
                case 0: this.parseHeartbeat(buffer, payloadStart); break;
                case 1: this.parseSysStatus(buffer, payloadStart); break;
                case 24: this.parseGPSRawInt(buffer, payloadStart); break;
                case 30: this.parseAttitude(buffer, payloadStart); break;
                case 74: this.parseVFRHUD(buffer, payloadStart); break;
            }
            return true;
        } catch (error) {
            console.error('❌ MAVLink parsing error:', error);
            return false;
        }
    }

    parseHeartbeat(buffer, payloadStart) {
        const customMode = buffer.readUInt32LE(payloadStart);
        const flightMode = this.getFlightMode(customMode);
        
        this.telemetryData.heartbeat = {
            flightMode: flightMode,
            customMode: customMode,
            timestamp: Date.now()
        };
        
        broadcastToClients('HEARTBEAT', this.telemetryData.heartbeat);
        console.log(`📊 Flight Mode: ${flightMode}`);
    }

    parseSysStatus(buffer, payloadStart) {
        const voltage = buffer.readUInt16LE(payloadStart + 14);
        const current = buffer.readInt16LE(payloadStart + 16);
        const remaining = buffer.readInt8(payloadStart + 21);
        
        this.telemetryData.battery = {
            voltage: voltage / 1000,
            current: Math.abs(current) / 100,
            remaining: remaining,
            timestamp: Date.now()
        };
        
        broadcastToClients('BATTERY', this.telemetryData.battery);
        console.log(`🔋 Battery: ${this.telemetryData.battery.voltage.toFixed(1)}V, ${this.telemetryData.battery.current.toFixed(1)}A, ${this.telemetryData.battery.remaining}%`);
    }

    parseGPSRawInt(buffer, payloadStart) {
    try {
        // CORRECT GPS_RAW_INT parsing with proper structure:
        const time_usec = buffer.readBigUInt64LE(payloadStart);
        const fix_type = buffer.readUInt8(payloadStart + 8);
        const lat = buffer.readInt32LE(payloadStart + 9);
        const lon = buffer.readInt32LE(payloadStart + 13);
        const alt = buffer.readInt32LE(payloadStart + 17);
        const eph = buffer.readUInt16LE(payloadStart + 21);
        const epv = buffer.readUInt16LE(payloadStart + 23);
        const vel = buffer.readUInt16LE(payloadStart + 25);
        const cog = buffer.readUInt16LE(payloadStart + 27);
        const satellites = buffer.readUInt8(payloadStart + 29);
        
        console.log(`📍 Raw GPS Data - Lat: ${lat}, Lon: ${lon}, Alt: ${alt}, Vel: ${vel}`);
        
        this.telemetryData.gps = {
            lat: lat / 1e7,      // Convert from degrees * 1e7 to decimal
            lon: lon / 1e7,      // Convert from degrees * 1e7 to decimal
            alt: alt / 1000,     // Convert from mm to meters
            speed: vel / 100,    // Convert from cm/s to m/s
            satellites: satellites,
            timestamp: Date.now()
        };
        
        broadcastToClients('GPS', this.telemetryData.gps);
        console.log(`📍 GPS: Lat: ${this.telemetryData.gps.lat.toFixed(6)}, Lon: ${this.telemetryData.gps.lon.toFixed(6)}, Alt: ${this.telemetryData.gps.alt}m, Speed: ${this.telemetryData.gps.speed}m/s`);
        
    } catch (error) {
        console.error('❌ GPS parsing error:', error);
    }
}

    parseAttitude(buffer, payloadStart) {
        try {
            // ATTITUDE structure:
            // 0-3: time_boot_ms (4 bytes)
            // 4-7: roll (4 bytes float)
            // 8-11: pitch (4 bytes float)
            // 12-15: yaw (4 bytes float)
            // ... (rest are speeds)
            
            const roll = buffer.readFloatLE(payloadStart + 4);
            const pitch = buffer.readFloatLE(payloadStart + 8);
            const yaw = buffer.readFloatLE(payloadStart + 12);
            
            this.telemetryData.attitude = {
                roll: roll * (180 / Math.PI),  // Convert radians to degrees
                pitch: pitch * (180 / Math.PI),
                yaw: yaw * (180 / Math.PI),
                timestamp: Date.now()
            };
            
            broadcastToClients('ATTITUDE', this.telemetryData.attitude);
            console.log(`📊 Attitude: Roll: ${this.telemetryData.attitude.roll.toFixed(1)}°, Pitch: ${this.telemetryData.attitude.pitch.toFixed(1)}°, Yaw: ${this.telemetryData.attitude.yaw.toFixed(1)}°`);
            
        } catch (error) {
            console.error('❌ Attitude parsing error:', error);
        }
    }

    parseVFRHUD(buffer, payloadStart) {
        try {
            const groundspeed = buffer.readFloatLE(payloadStart + 4);
            const altitude = buffer.readFloatLE(payloadStart + 12);
            
            this.telemetryData.vfrHud = {
                groundspeed: groundspeed,
                altitude: altitude,
                timestamp: Date.now()
            };
            
            // Update GPS with VFR_HUD data (often more reliable)
            if (this.telemetryData.gps) {
                this.telemetryData.gps.speed = groundspeed;
                this.telemetryData.gps.alt = altitude;
                broadcastToClients('GPS', this.telemetryData.gps);
            }
            
            broadcastToClients('VFR_HUD', this.telemetryData.vfrHud);
            console.log(`📏 VFR_HUD: Speed: ${groundspeed.toFixed(2)} m/s, Alt: ${altitude.toFixed(1)} m`);
            
        } catch (error) {
            console.error('❌ VFR_HUD parsing error:', error);
        }
    }

    getFlightMode(customMode) {
        const flightModes = {
            0: 'STABILIZE', 2: 'ALT_HOLD', 3: 'AUTO', 4: 'GUIDED',
            5: 'LOITER', 6: 'RTL', 7: 'CIRCLE', 9: 'LAND', 16: 'POSITION'
        };
        return flightModes[customMode] || `MODE_${customMode}`;
    }
}

const mavlinkParser = new MAVLinkParser();

function broadcastToClients(type, data) {
    const message = JSON.stringify({ type, data });
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

function startMAVLinkListener() {
    const udpSocket = dgram.createSocket('udp4');
    
    udpSocket.bind(14550, '0.0.0.0', () => {
        console.log('📡 MAVLink UDP listener started on 127.0.0.1:14550');
    });

    udpSocket.on('message', (msg) => {
        mavlinkParser.parseBuffer(msg);
    });

    udpSocket.on('error', (err) => {
        console.error('UDP error:', err);
    });
}

wss.on('connection', (ws) => {
    console.log('✅ GCS Dashboard connected');
    clients.add(ws);
    
    ws.send(JSON.stringify({
        type: 'INITIAL_DATA',
        data: mavlinkParser.telemetryData
    }));

    ws.on('close', () => {
        console.log('❌ GCS Dashboard disconnected');
        clients.delete(ws);
    });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Backend Ready' });
});

app.get('/api/telemetry', (req, res) => {
    res.json(mavlinkParser.telemetryData);
});

server.listen(PORT, '0.0.0.0', () => { // Listen on 0.0.0.0
    console.log(`🚀 Backend running on http://0.0.0.0:${PORT}`);
    startMAVLinkListener();
});