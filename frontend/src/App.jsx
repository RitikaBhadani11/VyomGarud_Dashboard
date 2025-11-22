import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Logo Component using your image
const VyomGarudLogo = () => (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ duration: 0.5 }}
    className="flex items-center space-x-3"
  >
    <motion.img
      src="/download (1).png"
      alt="VYOM GARUD"
      className="w-12 h-12 object-contain"
      whileHover={{ scale: 1.1, rotate: 5 }}
      transition={{ type: "spring", stiffness: 300 }}
    />
    <div>
      <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
        VYOM GARUD
      </h1>
      <p className="text-orange-300/60 text-xs font-light tracking-wider">DRONE COMMAND SYSTEM</p>
    </div>
  </motion.div>
);

function App() {
  const [telemetry, setTelemetry] = useState({});
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const ws = useRef(null);

  useEffect(() => {
    // Only connect automatically on initial load if needed
    // For full manual control, remove this and only connect via button
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);
const connectWebSocket = () => {
  try {
    setConnectionStatus('connecting');
    
    // Use the same domain as your backend
    const backendUrl = window.location.origin.replace('https://', 'wss://').replace('http://', 'ws://');
    const wsUrl = `${backendUrl}/ws`;
    
    console.log('🔗 Connecting to:', wsUrl);
    ws.current = new WebSocket(wsUrl);
    
    ws.current.onopen = () => {
      setConnectionStatus('connected');
      console.log('✅ WebSocket connected to backend');
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setTelemetry(prev => ({
          ...prev,
          ...message.data
        }));
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error);
      }
    };

    ws.current.onclose = () => {
      setConnectionStatus('disconnected');
      console.log('🔌 WebSocket disconnected');
    };

    ws.current.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      setConnectionStatus('error');
    };
    
  } catch (error) {
    console.error('❌ Failed to create WebSocket:', error);
    setConnectionStatus('error');
  }
};

const testBackend = async () => {
  const apiUrl = 'https://vyomgarud-dashboard-backend.onrender.com';
  
  try {
    const response = await fetch(`${apiUrl}/api/health`);
    const data = await response.json();
    alert(`Backend Status: ${data.status}\n${data.message}`);
  } catch (error) {
    alert('❌ Backend is not running!');
  }
};

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          bg: 'bg-emerald-500/20',
          text: 'text-emerald-300',
          border: 'border-emerald-500/50',
          shadow: 'shadow-emerald-500/20',
          dot: 'bg-emerald-400'
        };
      case 'connecting':
        return {
          bg: 'bg-amber-500/20',
          text: 'text-amber-300',
          border: 'border-amber-500/50',
          shadow: 'shadow-amber-500/20',
          dot: 'bg-amber-400'
        };
      case 'error':
        return {
          bg: 'bg-red-500/20',
          text: 'text-red-300',
          border: 'border-red-500/50',
          shadow: 'shadow-red-500/20',
          dot: 'bg-red-400'
        };
      default:
        return {
          bg: 'bg-red-500/20',
          text: 'text-red-300',
          border: 'border-red-500/50',
          shadow: 'shadow-red-500/20',
          dot: 'bg-red-400'
        };
    }
  };

  const statusColors = getStatusColor();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      {/* Orange Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-500/5 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,140,0,0.1),_transparent_50%)]"></div>
        {/* Animated grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,140,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,140,0,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 bg-black/40 backdrop-blur-2xl border-b border-orange-500/20 p-6 shadow-2xl shadow-orange-500/10"
      >
        <div className="flex justify-between items-center">
          <VyomGarudLogo />
          
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={testBackend}
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-orange-500/25 border border-orange-500/30 hover:border-orange-400/50"
            >
              System Check
            </motion.button>
          </div>
        </div>
        
        {/* Status Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center mt-4"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleConnection}
            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border transition-all duration-300 backdrop-blur-sm cursor-pointer ${statusColors.bg} ${statusColors.text} ${statusColors.border} ${statusColors.shadow}`}
          >
            <motion.div
              animate={{ 
                scale: connectionStatus === 'connected' ? [1, 1.2, 1] : 1,
              }}
              transition={{ 
                duration: connectionStatus === 'connected' ? 2 : 0.3,
                repeat: connectionStatus === 'connected' ? Infinity : 0
              }}
              className={`w-3 h-3 rounded-full mr-2 ${statusColors.dot}`}
            ></motion.div>
            <AnimatePresence mode="wait">
              <motion.span
                key={connectionStatus}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {connectionStatus === 'connected' && 'CONNECTED - Click to Disconnect'}
                {connectionStatus === 'connecting' && 'CONNECTING...'}
                {connectionStatus === 'disconnected' && 'DISCONNECTED - Click to Connect'}
                {connectionStatus === 'error' && 'ERROR - Click to Retry'}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </motion.header>

      {/* Main Content */}
      <div className="relative z-10 p-6">
        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <MetricCard 
            title="Flight Mode"
            value={telemetry.heartbeat?.flightMode || 'STANDBY'}
            icon="🛰️"
            gradient="from-orange-500 to-amber-500"
            isConnected={connectionStatus === 'connected'}
          />
          
          <MetricCard 
            title="Battery"
            value={`${telemetry.battery?.remaining ?? '--'}%`}
            icon="🔋"
            gradient="from-amber-500 to-yellow-500"
            isConnected={connectionStatus === 'connected'}
          />
          
          <MetricCard 
            title="Altitude"
            value={`${telemetry.gps?.alt ?? '--'} m`}
            icon="📈"
            gradient="from-orange-600 to-red-500"
            isConnected={connectionStatus === 'connected'}
          />
          
          <MetricCard 
            title="Speed"
            value={`${telemetry.gps?.speed ?? '--'} m/s`}
            icon="⚡"
            gradient="from-amber-600 to-orange-600"
            isConnected={connectionStatus === 'connected'}
          />
        </motion.div>

        {/* Data Panels Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          {/* Position Panel */}
          <div className="xl:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DataPanel 
              title="📍 Position & Navigation"
              icon="🌎"
              gradient="from-orange-500/10 to-amber-500/10"
              border="border-orange-500/30"
              isConnected={connectionStatus === 'connected'}
            >
              <DataRow label="Latitude" value={telemetry.gps?.lat} precision={6} isConnected={connectionStatus === 'connected'} />
              <DataRow label="Longitude" value={telemetry.gps?.lon} precision={6} isConnected={connectionStatus === 'connected'} />
              <DataRow label="Altitude" value={telemetry.gps?.alt} unit="m" isConnected={connectionStatus === 'connected'} />
              <DataRow label="Satellites" value={telemetry.gps?.satellites} isConnected={connectionStatus === 'connected'} />
              <DataRow label="Ground Speed" value={telemetry.gps?.speed} unit="m/s" precision={1} isConnected={connectionStatus === 'connected'} />
            </DataPanel>

            <DataPanel 
              title="📊 Attitude & Orientation"
              icon="🎯"
              gradient="from-amber-500/10 to-yellow-500/10"
              border="border-amber-500/30"
              isConnected={connectionStatus === 'connected'}
            >
              <DataRow label="Roll" value={telemetry.attitude?.roll} unit="°" precision={1} isConnected={connectionStatus === 'connected'} />
              <DataRow label="Pitch" value={telemetry.attitude?.pitch} unit="°" precision={1} isConnected={connectionStatus === 'connected'} />
              <DataRow label="Yaw" value={telemetry.attitude?.yaw} unit="°" precision={1} isConnected={connectionStatus === 'connected'} />
              <motion.div 
                className="mt-4 p-4 bg-black/30 rounded-xl border border-orange-500/20"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="text-sm text-orange-300 mb-3 font-medium">Orientation Visualization</div>
                <div className="flex justify-center space-x-6">
                  <div className="text-center">
                    <motion.div 
                      className="w-20 h-20 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-xl border border-orange-400/30 flex items-center justify-center shadow-lg"
                      animate={{ rotate: connectionStatus === 'connected' ? (telemetry.attitude?.roll || 0) : 0 }}
                      transition={{ type: "spring", stiffness: 100 }}
                    >
                      <span className="text-lg font-bold">
                        {connectionStatus === 'connected' ? (telemetry.attitude?.roll?.toFixed(0) || '0') : '--'}°
                      </span>
                    </motion.div>
                    <div className="text-xs text-orange-300 mt-2 font-medium">ROLL</div>
                  </div>
                  <div className="text-center">
                    <motion.div 
                      className="w-20 h-20 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-xl border border-amber-400/30 flex items-center justify-center shadow-lg"
                      animate={{ rotate: connectionStatus === 'connected' ? (telemetry.attitude?.pitch || 0) : 0 }}
                      transition={{ type: "spring", stiffness: 100 }}
                    >
                      <span className="text-lg font-bold">
                        {connectionStatus === 'connected' ? (telemetry.attitude?.pitch?.toFixed(0) || '0') : '--'}°
                      </span>
                    </motion.div>
                    <div className="text-xs text-amber-300 mt-2 font-medium">PITCH</div>
                  </div>
                </div>
              </motion.div>
            </DataPanel>
          </div>

          {/* Systems Panel */}
          <DataPanel 
            title="🔋 Power Systems"
            icon="⚡"
            gradient="from-yellow-500/10 to-amber-500/10"
            border="border-yellow-500/30"
            isConnected={connectionStatus === 'connected'}
          >
            <div className="space-y-4">
              <DataRow label="Voltage" value={telemetry.battery?.voltage} unit="V" precision={1} isConnected={connectionStatus === 'connected'} />
              <DataRow label="Current" value={telemetry.battery?.current} unit="A" precision={1} isConnected={connectionStatus === 'connected'} />
              <DataRow label="Remaining" value={telemetry.battery?.remaining} unit="%" isConnected={connectionStatus === 'connected'} />
              
              {/* Battery Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-amber-300 mb-2">
                  <span>Battery Level</span>
                  <span>{connectionStatus === 'connected' ? (telemetry.battery?.remaining || 0) : '--'}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3">
                  <motion.div 
                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: connectionStatus === 'connected' ? `${telemetry.battery?.remaining || 0}%` : '0%' }}
                    transition={{ duration: 1, type: "spring" }}
                  ></motion.div>
                </div>
              </div>

              {/* Power Consumption */}
              <motion.div 
                className="grid grid-cols-2 gap-4 mt-4 p-4 bg-black/30 rounded-xl border border-amber-500/10"
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-300">
                    {connectionStatus === 'connected' ? (telemetry.battery?.voltage || '--') : '--'}V
                  </div>
                  <div className="text-xs text-orange-300/70">Voltage</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-300">
                    {connectionStatus === 'connected' ? (telemetry.battery?.current || '--') : '--'}A
                  </div>
                  <div className="text-xs text-amber-300/70">Current Draw</div>
                </div>
              </motion.div>
            </div>
          </DataPanel>
        </div>
      </div>
    </div>
  );
}

// Enhanced Metric Card Component with Framer Motion
function MetricCard({ title, value, icon, gradient, isConnected }) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05, y: -5 }}
      className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 shadow-2xl transform transition-all duration-300 border border-white/10 relative overflow-hidden ${
        !isConnected ? 'opacity-50' : ''
      }`}
    >
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10"></div>
      
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <h3 className="text-white/80 text-sm font-medium uppercase tracking-wider">{title}</h3>
          <motion.div 
            className="text-3xl font-bold text-white mt-2"
            key={value}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            {isConnected ? value : '--'}
          </motion.div>
        </div>
        <motion.div 
          className="text-4xl opacity-90 filter drop-shadow-lg"
          whileHover={{ rotate: 12, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300 }}
          animate={{ opacity: isConnected ? 0.9 : 0.4 }}
        >
          {icon}
        </motion.div>
      </div>
      <div className="relative z-10 mt-4 w-full bg-white/20 rounded-full h-1.5">
        <motion.div 
          className="bg-white/70 h-1.5 rounded-full"
          animate={{ scaleX: isConnected ? [1, 1.1, 1] : 0.5 }}
          transition={{ duration: 2, repeat: isConnected ? Infinity : 0 }}
        ></motion.div>
      </div>
    </motion.div>
  );
}

// Enhanced Data Panel Component with Framer Motion
function DataPanel({ title, icon, gradient, border, children, isConnected }) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      whileHover={{ y: -2 }}
      className={`bg-black/40 backdrop-blur-xl rounded-2xl p-6 border ${border} shadow-2xl transition-all duration-300 relative overflow-hidden ${
        !isConnected ? 'opacity-60' : ''
      }`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10`}></div>
      
      <h2 className="text-xl font-semibold mb-4 flex items-center relative z-10">
        <motion.span 
          className="text-2xl mr-3 filter drop-shadow-lg"
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.5 }}
          animate={{ opacity: isConnected ? 1 : 0.6 }}
        >
          {icon}
        </motion.span>
        {title}
      </h2>
      <div className="space-y-3 relative z-10">
        {children}
      </div>
    </motion.div>
  );
}

// Enhanced Data Row Component with Framer Motion
function DataRow({ label, value, unit, precision, isConnected }) {
  const formatValue = (val) => {
    if (!isConnected) return '--';
    if (val === undefined || val === null) return '--';
    if (precision !== undefined) return Number(val).toFixed(precision);
    return val;
  };

  return (
    <motion.div
      className="flex justify-between items-center py-3 border-b border-white/10 last:border-b-0 group hover:bg-white/5 hover:px-3 rounded-lg transition-all duration-300"
      whileHover={{ x: 5 }}
      animate={{ opacity: isConnected ? 1 : 0.6 }}
    >
      <span className="text-gray-300 group-hover:text-white transition-colors">{label}:</span>
      <motion.span 
        className="font-semibold text-lg text-white bg-white/5 px-3 py-1 rounded-lg group-hover:bg-white/10 transition-all border border-white/5"
        whileHover={{ scale: isConnected ? 1.05 : 1 }}
      >
        {formatValue(value)} {unit || ''}
      </motion.span>
    </motion.div>
  );
}

export default App;