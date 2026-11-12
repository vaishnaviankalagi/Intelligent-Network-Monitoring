
from ml_anomaly_detection import analyze_packet_anomalies


# Generate 40 sample network packets
sample_packets = []

for i in range(38):
    sample_packets.append({
        "timestamp": "2026-11-11 13:00:00",
        "source_ip": "192.168.1.10",
        "destination_ip": "192.168.1.20",
        "protocol": "TCP",
        "packet_size": 500,
        "source_port": 5000 + i,
        "destination_port": 80
    })


# Add unusual sample packets
sample_packets.append({
    "timestamp": "2026-11-11 13:01:00",
    "source_ip": "10.0.0.99",
    "destination_ip": "192.168.1.20",
    "protocol": "UDP",
    "packet_size": 65000,
    "source_port": 65000,
    "destination_port": 65000
})

sample_packets.append({
    "timestamp": "2026-11-11 13:01:05",
    "source_ip": "172.16.0.99",
    "destination_ip": "8.8.8.8",
    "protocol": "ICMP",
    "packet_size": 60000,
    "source_port": 0,
    "destination_port": 0
})


# Run ML anomaly detection
result = analyze_packet_anomalies(sample_packets)

print("\nML ANOMALY DETECTION TEST")
print("-------------------------")
print("Status:", result["status"])
print("Total Packets:", result["total_packets"])
print("Anomalies Detected:", result["anomaly_count"])
print("Detected Anomalies:", result["anomalies"])
