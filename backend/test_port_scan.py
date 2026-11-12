
from scapy.all import IP, TCP
from packet_capture import analyze_packet, get_security_alerts

print("Testing Port Scan Detection...")

for port in range(20, 32):
    packet = (
        IP(src="192.168.1.100", dst="192.168.1.10")
        / TCP(sport=50000, dport=port, flags="S")
    )

    analyze_packet(packet)

print("\nSecurity Alerts:")

alerts = get_security_alerts()

for alert in alerts:
    print(alert)

print("\nTotal Alerts:", len(alerts))
