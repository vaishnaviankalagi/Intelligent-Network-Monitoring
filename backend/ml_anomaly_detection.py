
import pandas as pd

from sklearn.ensemble import IsolationForest


# Minimum packets required for anomaly detection
MINIMUM_PACKETS = 30

# Percentage of packets expected to be unusual
CONTAMINATION = 0.05


def analyze_packet_anomalies(packets):
    """
    Analyze captured network packets using Pandas
    and Scikit-learn Isolation Forest.
    """

    if not packets:
        return {
            "status": "insufficient_data",
            "message": "No network packets available.",
            "total_packets": 0,
            "anomaly_count": 0,
            "anomalies": []
        }

    # Convert packet data into a Pandas DataFrame
    df = pd.DataFrame(packets)

    required_columns = [
        "source_ip",
        "destination_ip",
        "protocol",
        "packet_size",
        "source_port",
        "destination_port"
    ]

    for column in required_columns:
        if column not in df.columns:
            df[column] = None

    # Prepare numeric traffic features
    df["packet_size"] = pd.to_numeric(
        df["packet_size"], errors="coerce"
    ).fillna(0)

    df["source_port"] = pd.to_numeric(
        df["source_port"], errors="coerce"
    ).fillna(0)

    df["destination_port"] = pd.to_numeric(
        df["destination_port"], errors="coerce"
    ).fillna(0)

    # Calculate IP frequency
    df["source_ip_count"] = (
        df["source_ip"].map(df["source_ip"].value_counts())
    )

    df["destination_ip_count"] = (
        df["destination_ip"].map(
            df["destination_ip"].value_counts()
        )
    )

    # Convert protocol names into numeric columns
    protocol_features = pd.get_dummies(
        df["protocol"].fillna("OTHER"),
        prefix="protocol",
        dtype=int
    )

    # Select features for machine learning
    features = pd.concat(
        [
            df[
                [
                    "packet_size",
                    "source_port",
                    "destination_port",
                    "source_ip_count",
                    "destination_ip_count"
                ]
            ],
            protocol_features
        ],
        axis=1
    )

    # Check whether enough packets are available
    if len(features) < MINIMUM_PACKETS:
        return {
            "status": "insufficient_data",
            "message": (
                f"At least {MINIMUM_PACKETS} packets "
                "are required for anomaly detection."
            ),
            "total_packets": len(df),
            "anomaly_count": 0,
            "anomalies": []
        }

    # Create the Isolation Forest model
    model = IsolationForest(
        n_estimators=100,
        contamination=CONTAMINATION,
        random_state=42
    )

    # Train and predict on the available packet batch
    predictions = model.fit_predict(features)

    # Calculate anomaly scores
    scores = model.decision_function(features)

    df["prediction"] = predictions
    df["anomaly_score"] = -scores

    # Extract unusual packets
    anomaly_df = df[df["prediction"] == -1].copy()

    anomalies = []

    for _, packet in anomaly_df.iterrows():

        anomalies.append({
            "timestamp": packet.get("timestamp"),
            "source_ip": packet.get("source_ip"),
            "destination_ip": packet.get("destination_ip"),
            "protocol": packet.get("protocol"),
            "packet_size": int(packet["packet_size"]),
            "source_port": int(packet["source_port"]),
            "destination_port": int(
                packet["destination_port"]
            ),
            "anomaly_score": round(
                float(packet["anomaly_score"]), 4
            ),
            "status": "Anomaly Detected"
        })

    return {
        "status": "success",
        "message": "Network traffic anomaly analysis completed.",
        "total_packets": len(df),
        "anomaly_count": len(anomalies),
        "anomalies": anomalies
    }
