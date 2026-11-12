import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000/api/network/stats";

const navigationItems = [
  { id: "dashboard", label: "Dashboard", icon: "▦" },
  { id: "monitoring", label: "Monitoring Analysis", icon: "◉" },
  { id: "traffic", label: "Network Traffic", icon: "⇄" },
  { id: "protocol", label: "Protocol Analysis", icon: "⌘" },
  { id: "packets", label: "Live Packet Monitoring", icon: "◈" },
  { id: "alerts", label: "Security Alerts", icon: "⚠" },
  { id: "ip", label: "IP Monitoring", icon: "◎" },
  { id: "ml", label: "ML Anomaly Detection", icon: "◉" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

function formatBytes(bytes) {
  if (bytes === null || bytes === undefined) return "N/A";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index++;
  }

  return `${value.toFixed(2)} ${units[index]}`;
}

function App() {
  const [activePage, setActivePage] = useState("dashboard");

  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [refreshInterval, setRefreshInterval] = useState(3);
  const [error, setError] = useState("");

  const [packets, setPackets] = useState([]);
  const [captureStatus, setCaptureStatus] = useState(false);
  const [protocolStats, setProtocolStats] = useState(null);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [statusSelections, setStatusSelections] = useState({});
  const [alertUpdateMessage, setAlertUpdateMessage] = useState("");
  const [alertSearch, setAlertSearch] = useState("");
  const [alertStatusFilter, setAlertStatusFilter] = useState("All");
  const [alertSeverityFilter, setAlertSeverityFilter] = useState("All");

  const currentPage = navigationItems.find((item) => item.id === activePage);

  const [ipConnections, setIpConnections] = useState([]);
  const [ipLoading, setIpLoading] = useState(true);
  const [ipError, setIpError] = useState("");
  const [ipSearch, setIpSearch] = useState("");
  const [ipProtocolFilter, setIpProtocolFilter] = useState("All");
  const [ipStatusFilter, setIpStatusFilter] = useState("All");
  // ML Anomaly Detection states
  const [mlResult, setMlResult] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState("");
  const [mlSearch, setMlSearch] = useState("");
  const [mlProtocolFilter, setMlProtocolFilter] = useState("All");

  // Fetch network statistics
  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      try {
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Backend returned an error");
        }

        const data = await response.json();

        if (!isMounted) return;

        setStats(data);
        setError("");

        setHistory((previous) => [...previous.slice(-11), data.download_mbps]);
      } catch (err) {
        if (isMounted) {
          setError("Cannot connect to backend. Check that FastAPI is running.");
        }
      }
    };

    fetchStats();

    const interval = setInterval(fetchStats, refreshInterval * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [refreshInterval]);

  // Fetch captured packets
  useEffect(() => {
    const fetchPackets = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/packets");

        if (!response.ok) {
          throw new Error("Unable to fetch packets");
        }

        const data = await response.json();
        setPackets(data.packets || []);
      } catch (err) {
        console.error("Packet fetching error:", err);
      }
    };

    fetchPackets();

    const interval = setInterval(fetchPackets, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch protocol statistics
  useEffect(() => {
    const fetchProtocolStats = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/protocol/stats",
        );

        if (!response.ok) {
          throw new Error("Unable to fetch protocol statistics");
        }

        const data = await response.json();
        setProtocolStats(data);
      } catch (err) {
        console.error("Protocol statistics error:", err);
      }
    };

    fetchProtocolStats();

    const interval = setInterval(fetchProtocolStats, 2000);

    return () => clearInterval(interval);
  }, []);

  // Fetch security alerts every 2 seconds
  useEffect(() => {
    const fetchSecurityAlerts = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/security/alerts",
        );

        if (!response.ok) {
          throw new Error("Unable to fetch security alerts");
        }

        const data = await response.json();
        setSecurityAlerts(data.alerts || []);
      } catch (error) {
        console.error("Security alerts error:", error);
      }
    };

    fetchSecurityAlerts();

    const interval = setInterval(fetchSecurityAlerts, 2000);

    return () => clearInterval(interval);
  }, []);

  // Fetch IP monitoring connections every 5 seconds
  useEffect(() => {
    let isMounted = true;

    const fetchIPConnections = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/ip-monitoring/connections",
        );

        if (!response.ok) {
          throw new Error("Unable to fetch IP connections");
        }

        const data = await response.json();

        if (isMounted) {
          setIpConnections(data.connections || []);
          setIpError("");
          setIpLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setIpError("Unable to load IP monitoring data.");
          setIpLoading(false);
          console.error("IP monitoring error:", error);
        }
      }
    };

    fetchIPConnections();

    const interval = setInterval(fetchIPConnections, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch ML anomaly detection results
  useEffect(() => {
    if (activePage !== "ml") return;

    let isMounted = true;

    const fetchMLAnomalies = async () => {
      try {
        setMlLoading(true);

        const response = await fetch("http://127.0.0.1:8000/api/ml/anomalies");

        if (!response.ok) {
          throw new Error("Unable to fetch ML anomaly results.");
        }

        const data = await response.json();

        if (isMounted) {
          setMlResult(data);
          setMlError("");
        }
      } catch (error) {
        if (isMounted) {
          setMlError(error.message);
        }
      } finally {
        if (isMounted) {
          setMlLoading(false);
        }
      }
    };

    fetchMLAnomalies();

    const interval = setInterval(fetchMLAnomalies, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activePage]);

  // Start packet monitoring
  const startMonitoring = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/packets/start", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Could not start monitoring");
      }

      setCaptureStatus(true);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Unable to start packet monitoring.");
    }
  };

  // Stop packet monitoring
  const stopMonitoring = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/packets/stop", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Could not stop monitoring");
      }

      setCaptureStatus(false);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Unable to stop packet monitoring.");
    }
  };

  // Update security alert status
  const updateAlertStatus = async (alertId) => {
    const newStatus = statusSelections[alertId];

    if (!newStatus) {
      setAlertUpdateMessage("Please select a status.");
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/security/alerts/${alertId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Unable to update alert status.");
      }

      setSecurityAlerts((previous) =>
        previous.map((alert) =>
          alert.alert_id === alertId ? data.alert : alert,
        ),
      );

      setAlertUpdateMessage("Alert status updated successfully.");

      setTimeout(() => {
        setAlertUpdateMessage("");
      }, 3000);
    } catch (error) {
      console.error("Alert update error:", error);
      setAlertUpdateMessage(error.message);
    }
  };

  const totalPackets = stats
    ? stats.packets_sent + stats.packets_received
    : null;

  const chartMaximum = Math.max(...history, 0.01);

  // Dashboard page

  // Dashboard page
  const renderDashboard = () => {
    const highAlerts = securityAlerts.filter(
      (alert) => alert.severity === "High",
    ).length;

    const newAlerts = securityAlerts.filter(
      (alert) => alert.status === "New",
    ).length;

    const investigatingAlerts = securityAlerts.filter(
      (alert) => alert.status === "Investigating",
    ).length;

    const resolvedAlerts = securityAlerts.filter(
      (alert) => alert.status === "Resolved",
    ).length;

    const threatCategories = [
      {
        name: "Port Scan",
        count: securityAlerts.filter((alert) =>
          alert.alert_type?.toLowerCase().includes("port scan"),
        ).length,
      },
      {
        name: "ML Anomalies",
        count: securityAlerts.filter((alert) =>
          alert.alert_type?.toLowerCase().includes("ml"),
        ).length,
      },
      {
        name: "Other Threats",
        count: securityAlerts.filter(
          (alert) =>
            !alert.alert_type?.toLowerCase().includes("port scan") &&
            !alert.alert_type?.toLowerCase().includes("ml"),
        ).length,
      },
    ];

    const maximumCategory = Math.max(
      ...threatCategories.map((item) => item.count),
      1,
    );

    const maximumTraffic = Math.max(...history, 0.01);

    const recentAlerts = securityAlerts.slice(0, 6);

    return (
      <>
        <section className="dashboard-welcome">
          <div>
            <span className="dashboard-eyebrow">NETWORK SECURITY CENTER</span>
            <h2>Network Security Overview</h2>
            <p>
              Monitor network activity, analyze threats and track security
              events in real time.
            </p>
          </div>

          <div className="dashboard-live-status">
            <span className="live-indicator"></span>
            {stats ? "SYSTEM ONLINE" : "CONNECTING"}
          </div>
        </section>

        {/* Main statistics */}
        <section className="stats dashboard-stats">
          <div className="stat-card">
            <div className="dashboard-card-heading">
              <span>Total Packets</span>
              <span className="dashboard-icon">◈</span>
            </div>
            <h2>{stats ? totalPackets.toLocaleString() : "Loading..."}</h2>
            <small>Sent and received packets</small>
          </div>

          <div className="stat-card">
            <div className="dashboard-card-heading">
              <span>Active Connections</span>
              <span className="dashboard-icon">◎</span>
            </div>
            <h2>
              {!stats
                ? "Loading..."
                : stats.connections_available
                  ? stats.active_connections
                  : "N/A"}
            </h2>
            <small>Current network connections</small>
          </div>

          <div className="stat-card">
            <div className="dashboard-card-heading">
              <span>Total Security Alerts</span>
              <span className="dashboard-icon">⚠</span>
            </div>
            <h2>{securityAlerts.length}</h2>
            <small>{newAlerts} alerts awaiting attention</small>
          </div>

          <div className="stat-card">
            <div className="dashboard-card-heading">
              <span>High Severity</span>
              <span className="dashboard-icon">◆</span>
            </div>
            <h2>{highAlerts}</h2>
            <small>High-priority security events</small>
          </div>
        </section>

        {/* Charts */}
        <section className="dashboard-chart-grid">
          {/* Threat classification */}
          <div className="panel dashboard-visual-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h3>Threat Classification</h3>
                <p>Security events grouped by detection type</p>
              </div>
              <span className="dashboard-period">ALL TIME</span>
            </div>

            {threatCategories.map((category, index) => (
              <div className="threat-category" key={category.name}>
                <div className="threat-category-info">
                  <span>
                    <i className={`threat-dot threat-dot-${index}`}></i>
                    {category.name}
                  </span>
                  <strong>{category.count}</strong>
                </div>

                <div className="threat-progress">
                  <div
                    className={`threat-progress-fill threat-fill-${index}`}
                    style={{
                      width: `${(category.count / maximumCategory) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}

            <div className="dashboard-chart-footer">
              Total classified events
              <strong>{securityAlerts.length}</strong>
            </div>
          </div>

          {/* Network activity */}
          <div className="panel dashboard-visual-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h3>Network Activity</h3>
                <p>Live download speed history</p>
              </div>
              <span className="dashboard-period">LIVE</span>
            </div>

            <div className="dashboard-activity-chart">
              {history.length === 0 ? (
                <p className="muted">Collecting network activity...</p>
              ) : (
                history.map((speed, index) => (
                  <div
                    className="activity-bar-wrapper"
                    key={index}
                    title={`${speed} Mbps`}
                  >
                    <div
                      className="activity-bar"
                      style={{
                        height: `${Math.max(
                          5,
                          (speed / maximumTraffic) * 100,
                        )}%`,
                      }}
                    ></div>
                  </div>
                ))
              )}
            </div>

            <div className="dashboard-chart-footer">
              Current download speed
              <strong>
                {stats ? `${stats.download_mbps} Mbps` : "Loading..."}
              </strong>
            </div>
          </div>

          {/* Threat status */}
          <div className="panel dashboard-visual-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h3>Threat Status</h3>
                <p>Current security alert status</p>
              </div>
              <span className="dashboard-period">ALL TIME</span>
            </div>

            <div className="threat-status-list">
              <div className="threat-status-item">
                <span>
                  <i className="status-dot status-dot-new"></i>New
                </span>
                <strong>{newAlerts}</strong>
              </div>

              <div className="threat-status-item">
                <span>
                  <i className="status-dot status-dot-investigating"></i>
                  Investigating
                </span>
                <strong>{investigatingAlerts}</strong>
              </div>

              <div className="threat-status-item">
                <span>
                  <i className="status-dot status-dot-resolved"></i>
                  Resolved
                </span>
                <strong>{resolvedAlerts}</strong>
              </div>
            </div>

            <div className="dashboard-chart-footer">
              Total alerts
              <strong>{securityAlerts.length}</strong>
            </div>
          </div>
        </section>

        {/* Recent security events */}
        <section className="panel dashboard-recent-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h3>Recent Security Events</h3>
              <p>Latest alerts received from network monitoring</p>
            </div>

            <button
              className="dashboard-view-all"
              onClick={() => setActivePage("alerts")}
            >
              View All Events →
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Alert Type</th>
                  <th>Source IP</th>
                  <th>Destination IP</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>

              <tbody>
                {recentAlerts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-message">
                      No security events available.
                    </td>
                  </tr>
                ) : (
                  recentAlerts.map((alert) => (
                    <tr key={alert.alert_id}>
                      <td>{alert.alert_type || "-"}</td>
                      <td>{alert.source_ip || "-"}</td>
                      <td>{alert.destination_ip || "-"}</td>
                      <td>
                        <span
                          className={
                            alert.severity === "High"
                              ? "dashboard-severity-high"
                              : "dashboard-severity-medium"
                          }
                        >
                          {alert.severity || "Unknown"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`dashboard-status dashboard-status-${(
                            alert.status || "new"
                          ).toLowerCase()}`}
                        >
                          {alert.status || "New"}
                        </span>
                      </td>
                      <td>{alert.timestamp || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </>
    );
  };

  // Monitoring Analysis page
  const renderMonitoring = () => (
    <>
      <section className="content-grid">
        <div className="panel">
          <h3>Live Download Traffic</h3>

          <p className="muted">
            Current speed: {stats ? stats.download_mbps : "0"} Mbps
          </p>

          <div className="chart">
            {history.length === 0 ? (
              <p className="muted">Collecting traffic measurements...</p>
            ) : (
              history.map((speed, index) => (
                <div className="bar" key={index}>
                  <div
                    style={{
                      height: `${Math.max(5, (speed / chartMaximum) * 100)}%`,
                    }}
                  ></div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel">
          <h3>Live Network Speed</h3>

          <div className="protocol">
            <span>Download</span>
            <strong>
              {stats ? `${stats.download_mbps} Mbps` : "Loading..."}
            </strong>
          </div>

          <div className="protocol">
            <span>Upload</span>
            <strong>
              {stats ? `${stats.upload_mbps} Mbps` : "Loading..."}
            </strong>
          </div>

          <div className="protocol">
            <span>Data sent</span>
            <strong>
              {stats ? formatBytes(stats.bytes_sent) : "Loading..."}
            </strong>
          </div>

          <div className="protocol">
            <span>Data received</span>
            <strong>
              {stats ? formatBytes(stats.bytes_received) : "Loading..."}
            </strong>
          </div>
        </div>
      </section>

      <section className="panel alerts">
        <h3>Monitoring Status</h3>

        <div className="alert-row">
          <span className="normal">Online</span>
          Backend API connection
        </div>

        <div className="alert-row">
          <span className="normal">Active</span>
          Network statistics collection
        </div>

        <div className="alert-row">
          <span className="normal">{captureStatus ? "Active" : "Stopped"}</span>
          Packet monitoring
        </div>

        <div className="alert-row">
          <span className="warning">Pending</span>
          Security threat detection
        </div>
      </section>
    </>
  );

  // Network Traffic page
  const renderTraffic = () => (
    <>
      <section className="stats">
        <div className="stat-card">
          <p>Download Speed</p>
          <h2>{stats ? `${stats.download_mbps} Mbps` : "Loading..."}</h2>
          <small>Current incoming speed</small>
        </div>

        <div className="stat-card">
          <p>Upload Speed</p>
          <h2>{stats ? `${stats.upload_mbps} Mbps` : "Loading..."}</h2>
          <small>Current outgoing speed</small>
        </div>

        <div className="stat-card">
          <p>Total Data Received</p>
          <h2>{stats ? formatBytes(stats.bytes_received) : "Loading..."}</h2>
          <small>Incoming network data</small>
        </div>

        <div className="stat-card">
          <p>Total Data Sent</p>
          <h2>{stats ? formatBytes(stats.bytes_sent) : "Loading..."}</h2>
          <small>Outgoing network data</small>
        </div>
      </section>

      <section className="panel">
        <h3>Network Traffic History</h3>

        <p className="muted">Live download speed measurements</p>

        <div className="chart">
          {history.length === 0 ? (
            <p className="muted">Collecting traffic measurements...</p>
          ) : (
            history.map((speed, index) => (
              <div className="bar" key={index}>
                <div
                  style={{
                    height: `${Math.max(5, (speed / chartMaximum) * 100)}%`,
                  }}
                ></div>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );

  // Protocol Analysis page
  const renderProtocol = () => {
    const protocols = [
      { name: "TCP", value: protocolStats?.tcp ?? 0 },
      { name: "UDP", value: protocolStats?.udp ?? 0 },
      { name: "DNS", value: protocolStats?.dns ?? 0 },
      { name: "ICMP", value: protocolStats?.icmp ?? 0 },
      { name: "OTHER", value: protocolStats?.other ?? 0 },
    ];

    const total = protocolStats?.total_packets ?? 0;

    return (
      <section className="panel protocol-analysis">
        <h3>Protocol Analysis</h3>

        <p className="muted">Distribution of captured network protocols</p>

        <div className="protocol-cards">
          {protocols.map((protocol) => {
            const percentage = total > 0 ? (protocol.value / total) * 100 : 0;

            return (
              <div className="protocol-card" key={protocol.name}>
                <div className="protocol-info">
                  <span>{protocol.name}</span>
                  <strong>{protocol.value}</strong>
                </div>

                <div className="protocol-progress">
                  <div
                    className="protocol-progress-fill"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>

                <small>{percentage.toFixed(1)}%</small>
              </div>
            );
          })}
        </div>

        <div className="protocol-total">
          Total Captured Packets:
          <strong>{total}</strong>
        </div>
      </section>
    );
  };

  // Live Packet Monitoring page
  const renderPackets = () => (
    <section className="panel packet-monitor">
      <h3>Live Packet Monitoring</h3>

      <div className="monitor-controls">
        <button
          className="start-button"
          onClick={startMonitoring}
          disabled={captureStatus}
        >
          Start Monitoring
        </button>

        <button
          className="stop-button"
          onClick={stopMonitoring}
          disabled={!captureStatus}
        >
          Stop Monitoring
        </button>

        <span className={captureStatus ? "monitor-active" : "monitor-stopped"}>
          {captureStatus ? "● Monitoring Active" : "● Monitoring Stopped"}
        </span>
      </div>

      <p className="muted">
        Captured packets currently stored: {packets.length} / 100
      </p>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Source IP</th>
              <th>Destination IP</th>
              <th>Protocol</th>
              <th>Source Port</th>
              <th>Destination Port</th>
              <th>Packet Size</th>
            </tr>
          </thead>

          <tbody>
            {packets.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-message">
                  No packets captured yet. Click Start Monitoring.
                </td>
              </tr>
            ) : (
              packets.map((packet, index) => (
                <tr key={`${packet.timestamp}-${index}`}>
                  <td>{packet.timestamp}</td>
                  <td>{packet.source_ip}</td>
                  <td>{packet.destination_ip}</td>
                  <td>{packet.protocol}</td>
                  <td>{packet.source_port ?? "-"}</td>
                  <td>{packet.destination_port ?? "-"}</td>
                  <td>{packet.packet_size} B</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  // Security Alerts page

  // Security Alerts page

  const renderSecurityAlerts = () => {
    const validAlerts = securityAlerts.filter(
      (alert) => alert && alert.alert_id,
    );

    const highAlerts = validAlerts.filter(
      (alert) => alert.severity === "High",
    ).length;

    const newAlerts = validAlerts.filter(
      (alert) => alert.status === "New",
    ).length;

    const investigatingAlerts = validAlerts.filter(
      (alert) => alert.status === "Investigating",
    ).length;

    const resolvedAlerts = validAlerts.filter(
      (alert) => alert.status === "Resolved",
    ).length;

    const filteredAlerts = validAlerts.filter((alert) => {
      const searchText = alertSearch.toLowerCase();

      const matchesSearch =
        (alert.alert_type || "").toLowerCase().includes(searchText) ||
        (alert.source_ip || "").toLowerCase().includes(searchText) ||
        (alert.destination_ip || "").toLowerCase().includes(searchText);

      const matchesStatus =
        alertStatusFilter === "All" || alert.status === alertStatusFilter;

      const matchesSeverity =
        alertSeverityFilter === "All" || alert.severity === alertSeverityFilter;

      return matchesSearch && matchesStatus && matchesSeverity;
    });

    return (
      <div className="security-page">
        {/* Page heading */}
        <section className="security-page-header">
          <div>
            <span className="security-eyebrow">THREAT MANAGEMENT</span>
            <h2>Security Threat Detection</h2>
            <p>
              Monitor suspicious network activities and manage detected security
              events.
            </p>
          </div>

          <div className="security-live-indicator">
            <span className="live-indicator"></span>
            LIVE MONITORING
          </div>
        </section>

        {/* Summary cards */}
        <section className="stats security-summary-grid">
          <div className="stat-card security-summary-card">
            <span className="security-card-icon">◈</span>
            <p>Total Alerts</p>
            <h2>{validAlerts.length}</h2>
            <small>All recorded security events</small>
          </div>

          <div className="stat-card security-summary-card">
            <span className="security-card-icon red">⚠</span>
            <p>High Severity</p>
            <h2>{highAlerts}</h2>
            <small>High-priority events</small>
          </div>

          <div className="stat-card security-summary-card">
            <span className="security-card-icon orange">●</span>
            <p>New Alerts</p>
            <h2>{newAlerts}</h2>
            <small>Awaiting investigation</small>
          </div>

          <div className="stat-card security-summary-card">
            <span className="security-card-icon green">✓</span>
            <p>Resolved Alerts</p>
            <h2>{resolvedAlerts}</h2>
            <small>Successfully closed events</small>
          </div>
        </section>

        {/* Alert status overview */}
        <section className="panel security-overview-panel">
          <div className="security-section-heading">
            <div>
              <h3>Alert Status Overview</h3>
              <p>Current distribution of security events</p>
            </div>
          </div>

          <div className="security-status-overview">
            <div className="security-status-block">
              <div className="security-status-label">
                <span>
                  <i className="status-dot status-dot-new"></i>New
                </span>
                <strong>{newAlerts}</strong>
              </div>
              <div className="security-status-track">
                <div
                  className="security-status-fill new-fill"
                  style={{
                    width: `${
                      validAlerts.length
                        ? (newAlerts / validAlerts.length) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="security-status-block">
              <div className="security-status-label">
                <span>
                  <i className="status-dot status-dot-investigating"></i>
                  Investigating
                </span>
                <strong>{investigatingAlerts}</strong>
              </div>
              <div className="security-status-track">
                <div
                  className="security-status-fill investigating-fill"
                  style={{
                    width: `${
                      validAlerts.length
                        ? (investigatingAlerts / validAlerts.length) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="security-status-block">
              <div className="security-status-label">
                <span>
                  <i className="status-dot status-dot-resolved"></i>
                  Resolved
                </span>
                <strong>{resolvedAlerts}</strong>
              </div>
              <div className="security-status-track">
                <div
                  className="security-status-fill resolved-fill"
                  style={{
                    width: `${
                      validAlerts.length
                        ? (resolvedAlerts / validAlerts.length) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </section>

        {/* Security events table */}
        <section className="panel security-events-panel">
          <div className="security-section-heading">
            <div>
              <h3>Detected Security Events</h3>
              <p>
                Review alerts, investigate suspicious IPs and update event
                status.
              </p>
            </div>

            <span className="security-record-count">
              {filteredAlerts.length} Records
            </span>
          </div>

          {alertUpdateMessage && (
            <p className="alert-update-message">{alertUpdateMessage}</p>
          )}

          {/* Search and filters */}
          <div className="security-toolbar">
            <div className="security-search">
              <span>⌕</span>
              <input
                type="text"
                placeholder="Search alert type or IP address..."
                value={alertSearch}
                onChange={(event) => setAlertSearch(event.target.value)}
              />
            </div>

            <select
              className="security-filter"
              value={alertSeverityFilter}
              onChange={(event) => setAlertSeverityFilter(event.target.value)}
            >
              <option value="All">All Severities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              className="security-filter"
              value={alertStatusFilter}
              onChange={(event) => setAlertStatusFilter(event.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Investigating">Investigating</option>
              <option value="Resolved">Resolved</option>
            </select>

            <button
              className="security-reset-button"
              onClick={() => {
                setAlertSearch("");
                setAlertSeverityFilter("All");
                setAlertStatusFilter("All");
              }}
            >
              Reset
            </button>
          </div>

          {/* Alerts table */}
          <div className="table-container security-table-container">
            <table className="security-events-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Alert Type</th>
                  <th>Source IP</th>
                  <th>Destination IP</th>
                  <th>Ports</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredAlerts.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-message">
                      No matching security alerts found.
                    </td>
                  </tr>
                ) : (
                  filteredAlerts.map((alert) => (
                    <tr key={alert.alert_id}>
                      <td className="security-timestamp">
                        {alert.timestamp || "-"}
                      </td>

                      <td className="security-alert-name">
                        {alert.alert_type || "-"}
                      </td>

                      <td className="security-ip">{alert.source_ip || "-"}</td>

                      <td className="security-ip">
                        {alert.destination_ip || "-"}
                      </td>

                      <td>
                        <span className="security-port-count">
                          {alert.port_count ?? 0} ports
                        </span>
                        <small className="security-port-list">
                          {Array.isArray(alert.ports_detected)
                            ? alert.ports_detected.join(", ")
                            : "-"}
                        </small>
                      </td>

                      <td>
                        <span
                          className={`security-severity ${(
                            alert.severity || "unknown"
                          ).toLowerCase()}`}
                        >
                          {alert.severity || "Unknown"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`security-status-badge ${(
                            alert.status || "new"
                          ).toLowerCase()}`}
                        >
                          {alert.status || "Unknown"}
                        </span>
                      </td>

                      <td>
                        <div className="security-action-cell">
                          <select
                            className="alert-status-select"
                            value={
                              statusSelections[alert.alert_id] ??
                              alert.status ??
                              "New"
                            }
                            onChange={(event) =>
                              setStatusSelections((previous) => ({
                                ...previous,
                                [alert.alert_id]: event.target.value,
                              }))
                            }
                          >
                            <option value="New">New</option>
                            <option value="Investigating">Investigating</option>
                            <option value="Resolved">Resolved</option>
                          </select>

                          <button
                            className="update-status-button"
                            onClick={() => updateAlertStatus(alert.alert_id)}
                            disabled={
                              (statusSelections[alert.alert_id] ??
                                alert.status) === alert.status
                            }
                          >
                            Update
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  };

  // IP Monitoring page

  // IP Monitoring page
  const renderIPMonitoring = () => {
    const publicConnections = ipConnections.filter(
      (connection) => connection.ip_category === "Public",
    ).length;

    const privateConnections = ipConnections.filter(
      (connection) => connection.ip_category === "Private",
    ).length;

    const loopbackConnections = ipConnections.filter(
      (connection) => connection.ip_category === "Loopback",
    ).length;

    const tcpConnections = ipConnections.filter(
      (connection) => (connection.protocol || "").toUpperCase() === "TCP",
    ).length;

    const udpConnections = ipConnections.filter(
      (connection) => (connection.protocol || "").toUpperCase() === "UDP",
    ).length;

    const establishedConnections = ipConnections.filter(
      (connection) => (connection.status || "").toUpperCase() === "ESTABLISHED",
    ).length;

    const filteredConnections = ipConnections.filter((connection) => {
      const searchText = ipSearch.toLowerCase();

      const matchesSearch =
        String(connection.pid ?? "")
          .toLowerCase()
          .includes(searchText) ||
        (connection.local_ip || "").toLowerCase().includes(searchText) ||
        (connection.remote_ip || "").toLowerCase().includes(searchText) ||
        String(connection.local_port ?? "").includes(searchText) ||
        String(connection.remote_port ?? "").includes(searchText);

      const matchesProtocol =
        ipProtocolFilter === "All" ||
        (connection.protocol || "").toUpperCase() === ipProtocolFilter;

      const matchesStatus =
        ipStatusFilter === "All" ||
        (connection.status || "").toUpperCase() === ipStatusFilter;

      return matchesSearch && matchesProtocol && matchesStatus;
    });

    return (
      <div className="ip-monitoring-page">
        {/* Page heading */}
        <section className="ip-page-header">
          <div>
            <span className="ip-eyebrow">NETWORK INTELLIGENCE</span>
            <h2>IP Connection Monitoring</h2>
            <p>
              Track active network connections, IP addresses, protocols and
              connection states in real time.
            </p>
          </div>

          <div className="ip-live-indicator">
            <span className="live-indicator"></span>
            LIVE CONNECTIONS
          </div>
        </section>

        {/* Summary cards */}
        <section className="stats ip-summary-grid">
          <div className="stat-card ip-summary-card">
            <span className="ip-card-icon">◎</span>
            <p>Total Connections</p>
            <h2>{ipConnections.length}</h2>
            <small>Currently detected connections</small>
          </div>

          <div className="stat-card ip-summary-card">
            <span className="ip-card-icon purple">↔</span>
            <p>TCP Connections</p>
            <h2>{tcpConnections}</h2>
            <small>Transmission Control Protocol</small>
          </div>

          <div className="stat-card ip-summary-card">
            <span className="ip-card-icon orange">⇄</span>
            <p>UDP Connections</p>
            <h2>{udpConnections}</h2>
            <small>User Datagram Protocol</small>
          </div>

          <div className="stat-card ip-summary-card">
            <span className="ip-card-icon green">✓</span>
            <p>Established</p>
            <h2>{establishedConnections}</h2>
            <small>Currently established TCP connections</small>
          </div>
        </section>

        {/* IP classification */}
        <section className="panel ip-classification-panel">
          <div className="ip-section-heading">
            <div>
              <h3>IP Address Classification</h3>
              <p>Distribution of detected IP connection categories</p>
            </div>
          </div>

          <div className="ip-classification-grid">
            <div className="ip-classification-item">
              <span className="ip-classification-icon public-icon">●</span>
              <div>
                <p>Public IP Connections</p>
                <h3>{publicConnections}</h3>
              </div>
            </div>

            <div className="ip-classification-item">
              <span className="ip-classification-icon private-icon">●</span>
              <div>
                <p>Private IP Connections</p>
                <h3>{privateConnections}</h3>
              </div>
            </div>

            <div className="ip-classification-item">
              <span className="ip-classification-icon loopback-icon">●</span>
              <div>
                <p>Loopback Connections</p>
                <h3>{loopbackConnections}</h3>
              </div>
            </div>
          </div>
        </section>

        {/* Live connections */}
        <section className="panel ip-connections-panel">
          <div className="ip-section-heading">
            <div>
              <h3>Active Network Connections</h3>
              <p>
                Inspect local and remote endpoints, ports, processes and status.
              </p>
            </div>

            <span className="ip-record-count">
              {filteredConnections.length} Records
            </span>
          </div>

          {ipLoading && <p className="muted">Loading IP monitoring data...</p>}

          {ipError && <p className="error-message">{ipError}</p>}

          {!ipLoading && !ipError && (
            <>
              {/* Search and filters */}
              <div className="ip-toolbar">
                <div className="ip-search">
                  <span>⌕</span>
                  <input
                    type="text"
                    placeholder="Search IP address, port or PID..."
                    value={ipSearch}
                    onChange={(event) => setIpSearch(event.target.value)}
                  />
                </div>

                <select
                  className="ip-filter"
                  value={ipProtocolFilter}
                  onChange={(event) => setIpProtocolFilter(event.target.value)}
                >
                  <option value="All">All Protocols</option>
                  <option value="TCP">TCP</option>
                  <option value="UDP">UDP</option>
                </select>

                <select
                  className="ip-filter"
                  value={ipStatusFilter}
                  onChange={(event) => setIpStatusFilter(event.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="ESTABLISHED">Established</option>
                  <option value="LISTEN">Listen</option>
                  <option value="TIME_WAIT">Time Wait</option>
                  <option value="CLOSE_WAIT">Close Wait</option>
                  <option value="SYN_SENT">SYN Sent</option>
                  <option value="NONE">None</option>
                </select>

                <button
                  className="ip-reset-button"
                  onClick={() => {
                    setIpSearch("");
                    setIpProtocolFilter("All");
                    setIpStatusFilter("All");
                  }}
                >
                  Reset
                </button>
              </div>

              {/* Connections table */}
              <div className="table-container ip-table-container">
                <table className="ip-connections-table">
                  <thead>
                    <tr>
                      <th>PID</th>
                      <th>Protocol</th>
                      <th>Local IP</th>
                      <th>Local Port</th>
                      <th>Remote IP</th>
                      <th>Remote Port</th>
                      <th>IP Category</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredConnections.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="empty-message">
                          No matching network connections found.
                        </td>
                      </tr>
                    ) : (
                      filteredConnections.map((connection, index) => {
                        const category = (
                          connection.ip_category || "Unknown"
                        ).toLowerCase();

                        const status = (
                          connection.status || "N/A"
                        ).toUpperCase();

                        return (
                          <tr
                            key={`${connection.pid}-${connection.local_ip}-${connection.local_port}-${index}`}
                          >
                            <td>{connection.pid ?? "-"}</td>

                            <td>
                              <span
                                className={`ip-protocol-badge ${(
                                  connection.protocol || ""
                                ).toLowerCase()}`}
                              >
                                {connection.protocol || "N/A"}
                              </span>
                            </td>

                            <td className="ip-address-cell">
                              {connection.local_ip || "-"}
                            </td>

                            <td>{connection.local_port ?? "-"}</td>

                            <td className="ip-address-cell">
                              {connection.remote_ip || "-"}
                            </td>

                            <td>{connection.remote_port ?? "-"}</td>

                            <td>
                              <span className={`ip-category-badge ${category}`}>
                                {connection.ip_category || "Unknown"}
                              </span>
                            </td>

                            <td>
                              <span
                                className={`ip-connection-status ${status
                                  .toLowerCase()
                                  .replace(/\s+/g, "-")}`}
                              >
                                {connection.status || "N/A"}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="ip-table-footer">
                <span>
                  Showing {filteredConnections.length} of {ipConnections.length}{" "}
                  connections
                </span>
                <span>Auto-refreshes every 5 seconds</span>
              </div>
            </>
          )}
        </section>
      </div>
    );
  };

  // ML Anomaly Detection page
  const renderMLAnomalies = () => {
    const anomalies = mlResult?.anomalies || [];

    const totalPackets = mlResult?.total_packets || 0;
    const anomalyCount = mlResult?.anomaly_count || 0;
    const normalPackets = Math.max(0, totalPackets - anomalyCount);

    const anomalyPercentage =
      totalPackets > 0
        ? ((anomalyCount / totalPackets) * 100).toFixed(1)
        : "0.0";

    const filteredAnomalies = anomalies.filter((anomaly) => {
      const search = mlSearch.toLowerCase();

      const matchesSearch =
        (anomaly.source_ip || "").toLowerCase().includes(search) ||
        (anomaly.destination_ip || "").toLowerCase().includes(search) ||
        (anomaly.timestamp || "").toLowerCase().includes(search) ||
        String(anomaly.source_port ?? "").includes(search) ||
        String(anomaly.destination_port ?? "").includes(search);

      const matchesProtocol =
        mlProtocolFilter === "All" ||
        (anomaly.protocol || "").toUpperCase() === mlProtocolFilter;

      return matchesSearch && matchesProtocol;
    });

    return (
      <div className="ml-monitoring-page">
        {/* Page heading */}
        <section className="ml-page-header">
          <div>
            <span className="ml-eyebrow">INTELLIGENT THREAT ANALYTICS</span>
            <h2>ML Anomaly Detection</h2>
            <p>
              Identify statistically unusual network traffic using Machine
              Learning and Isolation Forest.
            </p>
          </div>

          <div className="ml-live-indicator">
            <span className="live-indicator"></span>
            AI ANALYSIS
          </div>
        </section>

        {/* Summary cards */}
        <section className="stats ml-summary-grid">
          <div className="stat-card ml-summary-card">
            <span className="ml-card-icon">◈</span>
            <p>Total Packets Analyzed</p>
            <h2>{totalPackets.toLocaleString()}</h2>
            <small>Captured network packets</small>
          </div>

          <div className="stat-card ml-summary-card">
            <span className="ml-card-icon orange">⚠</span>
            <p>Anomalies Detected</p>
            <h2>{anomalyCount}</h2>
            <small>Statistically unusual packets</small>
          </div>

          <div className="stat-card ml-summary-card">
            <span className="ml-card-icon green">✓</span>
            <p>Normal Packets</p>
            <h2>{normalPackets.toLocaleString()}</h2>
            <small>Not flagged as anomalies</small>
          </div>

          <div className="stat-card ml-summary-card">
            <span className="ml-card-icon purple">◎</span>
            <p>Detection Algorithm</p>
            <h2 className="ml-algorithm-name">Isolation Forest</h2>
            <small>Scikit-learn unsupervised model</small>
          </div>
        </section>

        {/* Analysis overview */}
        <section className="panel ml-analysis-panel">
          <div className="ml-section-heading">
            <div>
              <h3>Analysis Overview</h3>
              <p>Current machine learning analysis results</p>
            </div>

            <span
              className={`ml-analysis-badge ${
                mlResult?.status === "success" ? "success" : "waiting"
              }`}
            >
              {mlResult?.status === "success"
                ? "ANALYSIS COMPLETED"
                : "WAITING FOR DATA"}
            </span>
          </div>

          {mlLoading && (
            <p className="muted">Analyzing captured network traffic...</p>
          )}

          {mlError && <p className="error-message">{mlError}</p>}

          {mlResult && (
            <>
              <div className="ml-analysis-message">
                <span>Analysis Message</span>
                <strong>{mlResult.message}</strong>
              </div>

              <div className="ml-detection-progress">
                <div className="ml-progress-heading">
                  <span>Detected anomaly percentage</span>
                  <strong>{anomalyPercentage}%</strong>
                </div>

                <div className="ml-progress-track">
                  <div
                    className="ml-progress-fill"
                    style={{
                      width: `${Math.min(Number(anomalyPercentage), 100)}%`,
                    }}
                  ></div>
                </div>

                <div className="ml-progress-footer">
                  <span>{anomalyCount} unusual packets</span>
                  <span>{normalPackets} normal packets</span>
                </div>
              </div>

              <div className="ml-model-info">
                <div>
                  <span>Detection Method</span>
                  <strong>Isolation Forest</strong>
                </div>

                <div>
                  <span>Data Processing</span>
                  <strong>Pandas DataFrame</strong>
                </div>

                <div>
                  <span>ML Framework</span>
                  <strong>Scikit-learn</strong>
                </div>
              </div>
            </>
          )}

          <p className="ml-refresh-note">
            <span className="live-indicator"></span>
            Results automatically refresh every 5 seconds while this page is
            open.
          </p>
        </section>

        {/* Anomaly records */}
        <section className="panel ml-anomalies-panel">
          <div className="ml-section-heading">
            <div>
              <h3>Detected Network Anomalies</h3>
              <p>
                Network packets identified as statistically unusual by the
                model.
              </p>
            </div>

            <span className="ml-record-count">
              {filteredAnomalies.length} Records
            </span>
          </div>

          {/* Search and filters */}
          <div className="ml-toolbar">
            <div className="ml-search">
              <span>⌕</span>
              <input
                type="text"
                placeholder="Search source IP, destination IP or port..."
                value={mlSearch}
                onChange={(event) => setMlSearch(event.target.value)}
              />
            </div>

            <select
              className="ml-filter"
              value={mlProtocolFilter}
              onChange={(event) => setMlProtocolFilter(event.target.value)}
            >
              <option value="All">All Protocols</option>
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
              <option value="DNS">DNS</option>
              <option value="ICMP">ICMP</option>
              <option value="OTHER">OTHER</option>
            </select>

            <button
              className="ml-reset-button"
              onClick={() => {
                setMlSearch("");
                setMlProtocolFilter("All");
              }}
            >
              Reset
            </button>
          </div>

          {/* Anomaly table */}
          <div className="table-container ml-table-container">
            <table className="ml-anomalies-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Source IP</th>
                  <th>Destination IP</th>
                  <th>Protocol</th>
                  <th>Packet Size</th>
                  <th>Source Port</th>
                  <th>Destination Port</th>
                  <th>Anomaly Score</th>
                  <th>Result</th>
                </tr>
              </thead>

              <tbody>
                {filteredAnomalies.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="empty-message">
                      {mlResult?.status === "insufficient_data"
                        ? "Insufficient packets. At least 30 packets are required."
                        : anomalies.length > 0
                          ? "No anomalies match your search or filter."
                          : "No anomalies detected in the current analysis."}
                    </td>
                  </tr>
                ) : (
                  filteredAnomalies.map((anomaly, index) => (
                    <tr key={`${anomaly.timestamp}-${index}`}>
                      <td>{anomaly.timestamp || "-"}</td>

                      <td className="ml-ip-cell">{anomaly.source_ip || "-"}</td>

                      <td className="ml-ip-cell">
                        {anomaly.destination_ip || "-"}
                      </td>

                      <td>
                        <span
                          className={`ml-protocol-badge ${(
                            anomaly.protocol || ""
                          ).toLowerCase()}`}
                        >
                          {anomaly.protocol || "N/A"}
                        </span>
                      </td>

                      <td>{anomaly.packet_size ?? "-"} B</td>

                      <td>{anomaly.source_port ?? "-"}</td>

                      <td>{anomaly.destination_port ?? "-"}</td>

                      <td className="ml-score-cell">
                        {Number(anomaly.anomaly_score).toFixed(4)}
                      </td>

                      <td>
                        <span className="ml-anomaly-status">Unusual</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="ml-table-footer">
            <span>
              Showing {filteredAnomalies.length} of {anomalies.length} anomalies
            </span>
            <span>Analysis algorithm: Isolation Forest</span>
          </div>
        </section>
      </div>
    );
  };

  // Settings page
  const renderSettings = () => (
    <div className="settings-page">
      {/* Page Header */}
      <section className="settings-page-header">
        <div>
          <span className="settings-eyebrow">SYSTEM CONFIGURATION</span>
          <h2>Settings & Configuration</h2>
          <p>
            Manage monitoring preferences, system controls and application
            information.
          </p>
        </div>

        <div className="settings-version-badge">VERSION 1.0.0</div>
      </section>

      {/* General Settings */}
      <section className="panel settings-panel">
        <div className="settings-section-heading">
          <div className="settings-icon purple">⚙</div>
          <div>
            <h3>General Settings</h3>
            <p>Configure dashboard behavior and refresh preferences.</p>
          </div>
        </div>

        <div className="settings-option">
          <div>
            <strong>Dashboard Statistics Refresh Interval</strong>
            <p>Choose how frequently network statistics are retrieved.</p>
          </div>

          <select
            className="settings-select"
            value={refreshInterval}
            onChange={(event) => setRefreshInterval(Number(event.target.value))}
          >
            <option value={1}>Every 1 second</option>
            <option value={3}>Every 3 seconds</option>
            <option value={5}>Every 5 seconds</option>
            <option value={10}>Every 10 seconds</option>
          </select>
        </div>

        <div className="settings-action-row">
          <span>Default refresh interval: 3 seconds</span>

          <button
            className="settings-reset-button"
            onClick={() => setRefreshInterval(3)}
            disabled={refreshInterval === 3}
          >
            Reset to Default
          </button>
        </div>
      </section>

      {/* Network Monitoring */}
      <section className="panel settings-panel">
        <div className="settings-section-heading">
          <div className="settings-icon green">⌁</div>
          <div>
            <h3>Network Monitoring</h3>
            <p>Control live packet capture using the monitoring service.</p>
          </div>
        </div>

        <div className="settings-monitor-box">
          <div>
            <strong>Packet Capture Service</strong>
            <p>Manage real-time network traffic monitoring.</p>
          </div>

          <span
            className={
              captureStatus
                ? "settings-monitor-status active"
                : "settings-monitor-status stopped"
            }
          >
            <span className="live-indicator"></span>
            {captureStatus ? "Monitoring Active" : "Monitoring Stopped"}
          </span>
        </div>

        <div className="settings-monitor-actions">
          <button
            className="settings-start-button"
            onClick={startMonitoring}
            disabled={captureStatus}
          >
            Start Monitoring
          </button>

          <button
            className="settings-stop-button"
            onClick={stopMonitoring}
            disabled={!captureStatus}
          >
            Stop Monitoring
          </button>
        </div>
      </section>

      {/* Security Alerts */}
      <section className="panel settings-panel">
        <div className="settings-section-heading">
          <div className="settings-icon orange">⚠</div>
          <div>
            <h3>Security Alerts Overview</h3>
            <p>Current security alert information from the backend.</p>
          </div>
        </div>

        <div className="stats settings-alert-grid">
          <div className="stat-card settings-alert-card">
            <span className="settings-alert-icon purple">◈</span>
            <p>Total Alerts</p>
            <h2>{securityAlerts.length}</h2>
            <small>Recorded security events</small>
          </div>

          <div className="stat-card settings-alert-card">
            <span className="settings-alert-icon orange">●</span>
            <p>New Alerts</p>
            <h2>
              {securityAlerts.filter((alert) => alert.status === "New").length}
            </h2>
            <small>Awaiting investigation</small>
          </div>

          <div className="stat-card settings-alert-card">
            <span className="settings-alert-icon red">▲</span>
            <p>High Severity</p>
            <h2>
              {
                securityAlerts.filter((alert) => alert.severity === "High")
                  .length
              }
            </h2>
            <small>High-priority security events</small>
          </div>
        </div>
      </section>

      {/* System Information */}
      <section className="panel settings-panel">
        <div className="settings-section-heading">
          <div className="settings-icon blue">▣</div>
          <div>
            <h3>System Information</h3>
            <p>Application details and current service connectivity.</p>
          </div>
        </div>

        <div className="settings-information-list">
          <div className="settings-information-row">
            <span>Application</span>
            <strong>Intelligent Network Monitoring System</strong>
          </div>

          <div className="settings-information-row">
            <span>Application Version</span>
            <strong>1.0.0</strong>
          </div>

          <div className="settings-information-row">
            <span>Backend API</span>
            <strong
              className={stats ? "settings-connected" : "settings-connecting"}
            >
              <span className="live-indicator"></span>
              {stats ? "Connected" : "Connecting..."}
            </strong>
          </div>

          <div className="settings-information-row">
            <span>IP Connections Currently Detected</span>
            <strong>{ipConnections.length}</strong>
          </div>

          <div className="settings-information-row">
            <span>Dashboard Refresh Interval</span>
            <strong>{refreshInterval} seconds</strong>
          </div>

          <div className="settings-information-row">
            <span>Machine Learning Algorithm</span>
            <strong>Isolation Forest</strong>
          </div>

          <div className="settings-information-row">
            <span>Database</span>
            <strong>MySQL</strong>
          </div>
        </div>
      </section>
    </div>
  );

  // Display selected page
  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return renderDashboard();

      case "monitoring":
        return renderMonitoring();

      case "traffic":
        return renderTraffic();

      case "protocol":
        return renderProtocol();

      case "packets":
        return renderPackets();

      case "alerts":
        return renderSecurityAlerts();

      case "ip":
        return renderIPMonitoring();

      case "ml":
        return renderMLAnomalies();

      case "settings":
        return renderSettings();

      default:
        return renderDashboard();
    }
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <h2>NetMonitor</h2>
        <p className="subtitle">INTELLIGENT SECURITY</p>

        <nav>
          {navigationItems.map((item) => (
            <button
              key={item.id}
              className={
                activePage === item.id
                  ? "sidebar-nav-button active"
                  : "sidebar-nav-button"
              }
              onClick={() => setActivePage(item.id)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          Network Monitoring System
          <p>Version 1.0.0</p>
        </div>
      </aside>

      <main className="main-content">
        <header>
          <div>
            <h1>{currentPage?.label || "Dashboard"}</h1>
            <p>Monitor and analyze your network activity</p>
          </div>

          <div className="status">
            <span></span>
            {stats ? "System Online" : "Connecting..."}
          </div>
        </header>

        {error && <div className="error-message">{error}</div>}

        {renderPage()}

        <footer>Intelligent Network Monitoring System © 2026</footer>
      </main>
    </div>
  );
}

export default App;
