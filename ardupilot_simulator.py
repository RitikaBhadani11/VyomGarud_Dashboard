import socket
import time
import struct

class MAVLinkSimulator:
    def __init__(self):
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.sequence = 0
        self.sysid = 1
        self.compid = 1
        print("🚀 MAVLink Simulator Started")
        print("📡 Sending to 127.0.0.1:14550")

    def calculate_checksum(self, data, extra_crc=0):
        """Calculate MAVLink CRC (simplified version)"""
        # For simulation purposes, we'll use a simple checksum
        checksum = extra_crc
        for byte in data:
            checksum = (checksum + byte) & 0xFFFF
        return checksum

    def create_heartbeat(self):
        # HEARTBEAT (ID #0) - ALT_HOLD mode
        payload = struct.pack('<IBBBBB', 
            2,  # ALT_HOLD (custom_mode = 2)
            2,  # MAV_TYPE_QUADROTOR
            3,  # MAV_AUTOPILOT_ARDUPILOTMEGA
            81, # base_mode
            4,  # MAV_STATE_ACTIVE
            3   # mavlink_version
        )
        
        header = struct.pack('<BBBBBB', 
            0xFE, len(payload), self.sequence, self.sysid, self.compid, 0
        )
        
        checksum = self.calculate_checksum(header[1:] + payload, 50)
        message = header + payload + struct.pack('<H', checksum)
        self.sequence = (self.sequence + 1) % 256
        return message

    def create_sys_status(self):
    # SYS_STATUS (ID #1) - Correct structure
    # Create payload with correct structure
        payload = bytearray(31)  # SYS_STATUS is 31 bytes
        
        # Set battery values at correct offsets
        # voltage_battery at offset 14 (uint16_t) - 12.8V = 12800 mV
        struct.pack_into('<H', payload, 14, 12800)
        
        # current_battery at offset 16 (int16_t) - -6.0A = -600 cA
        struct.pack_into('<h', payload, 16, -600)
        
        # battery_remaining at offset 21 (int8_t) - 80%
        payload[21] = 80
        
        header = struct.pack('<BBBBBB', 
            0xFE, len(payload), self.sequence, self.sysid, self.compid, 1
        )
        
        checksum = self.calculate_checksum(header[1:] + bytes(payload), 124)
        message = header + bytes(payload) + struct.pack('<H', checksum)
        self.sequence = (self.sequence + 1) % 256
        return message
    def create_gps_raw_int(self):
        # GPS_RAW_INT (ID #24) - Zurich coordinates
        time_usec = int(time.time() * 1e6) & 0xFFFFFFFFFFFFFFFF  # Ensure 64-bit range
        
        payload = struct.pack('<QiiiHHHHBB',
            time_usec,          # time_usec (uint64_t)
            3,                  # fix_type (3D fix)
            int(47.3769 * 1e7), # lat (Zurich)
            int(8.5417 * 1e7),  # lon (Zurich)
            50000,              # alt (50m in mm)
            100,                # eph
            100,                # epv
            500,                # vel (5 m/s in cm/s)
            0,                  # cog
            12                  # satellites_visible
        )
        
        header = struct.pack('<BBBBBB', 
            0xFE, len(payload), self.sequence, self.sysid, self.compid, 24
        )
        
        checksum = self.calculate_checksum(header[1:] + payload, 24)
        message = header + payload + struct.pack('<H', checksum)
        self.sequence = (self.sequence + 1) % 256
        return message

    def create_attitude(self):
        # ATTITUDE (ID #30)
        time_boot_ms = int(time.time() * 1000) & 0xFFFFFFFF  # Ensure 32-bit range
        
        payload = struct.pack('<Iffffff',
            time_boot_ms,   # time_boot_ms (uint32_t)
            0.1,            # roll (radians)
            -0.05,          # pitch (radians)  
            1.57,           # yaw (radians)
            0.0,            # rollspeed
            0.0,            # pitchspeed
            0.0             # yawspeed
        )
        
        header = struct.pack('<BBBBBB', 
            0xFE, len(payload), self.sequence, self.sysid, self.compid, 30
        )
        
        checksum = self.calculate_checksum(header[1:] + payload, 39)
        message = header + payload + struct.pack('<H', checksum)
        self.sequence = (self.sequence + 1) % 256
        return message

    def create_vfr_hud(self):
        # VFR_HUD (ID #74) - Provides speed data
        payload = struct.pack('<ffffH',
            0.0,    # airspeed
            5.0,    # groundspeed (5 m/s)
            0.0,    # heading
            1000,   # throttle (0-1000)
            10000   # alt (100m in cm)
        )
        
        header = struct.pack('<BBBBBB', 
            0xFE, len(payload), self.sequence, self.sysid, self.compid, 74
        )
        
        checksum = self.calculate_checksum(header[1:] + payload, 20)
        message = header + payload + struct.pack('<H', checksum)
        self.sequence = (self.sequence + 1) % 256
        return message

    def start(self):
        try:
            print("🎯 Starting MAVLink data stream...")
            print("📊 Sending: HEARTBEAT, SYS_STATUS, GPS, ATTITUDE, VFR_HUD\n")
            
            iteration = 0
            while True:
                iteration += 1
                
                print(f"\n--- Iteration {iteration} ---")
                
                # Send all messages
                messages = [
                    (self.create_heartbeat, "HEARTBEAT - ALT_HOLD"),
                    (self.create_sys_status, "SYS_STATUS - 12.8V, 6.0A, 80%"),
                    (self.create_gps_raw_int, "GPS - Zurich coordinates"),
                    (self.create_attitude, "ATTITUDE - Roll: 5.7°, Pitch: -2.9°, Yaw: 90.0°"),
                    (self.create_vfr_hud, "VFR_HUD - Speed: 5.0 m/s")
                ]
                
                for message_func, description in messages:
                    try:
                        message = message_func()
                        self.sock.sendto(message, ('127.0.0.1', 14550))
                        print(f"📤 {description}")
                        time.sleep(0.1)  # Small delay between messages
                    except Exception as e:
                        print(f"❌ Error sending {description}: {e}")
                        import traceback
                        traceback.print_exc()
                        continue
                
                time.sleep(2)
                
        except KeyboardInterrupt:
            print("\n🛑 Simulator stopped")
        except Exception as e:
            print(f"❌ Fatal Error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    simulator = MAVLinkSimulator()
    simulator.start()