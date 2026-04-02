import requests
import time

BASE_URL = "https://storage.googleapis.com/storage/v1/b/p-2-cen1/o/October%2F1%2FOctober_105_1.txt?alt=media"

def get_value(json_data, param_id):
    """
    Safely extracts the 'Value' field from a specific Parameter_XXXX key 
    and converts it to a float. Returns None if missing.
    """
    key = f"Parameter_{param_id}"
    try:
        if key in json_data and "Value" in json_data[key]:
            return float(json_data[key]["Value"])
    except (ValueError, TypeError):
        pass
    return None

def fetch_telemetry():
    """
    Fetches and parses the latest telemetry data from the JSON endpoint.
    """
    try:
        response = requests.get(BASE_URL, timeout=2)
        response.raise_for_status()
        
        # GCS returns the generation ID in the headers
        current_generation = response.headers.get('x-goog-generation', 'Unknown')
        
        # Parse the response as JSON
        data = response.json()
        
        # Extract the required fields using JSON keys
        telemetry = {
            "snapshot_timestamp": get_value(data, 5010),
            "generation_header": current_generation,
            "position_m": {
                "X": get_value(data, 2003),
                "Y": get_value(data, 2004),
                "Z": get_value(data, 2005)
            },
            "velocity_ms": {
                "X": get_value(data, 2009),
                "Y": get_value(data, 2010),
                "Z": get_value(data, 2011)
            },
            "attitude_quaternion": {
                "q1": get_value(data, 2012),
                "q2": get_value(data, 2013),
                "q3": get_value(data, 2014),
                "q4": get_value(data, 2015)
            }
        }
        return telemetry

    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        return None
    except ValueError as e:
        print(f"Error parsing JSON: {e}")
        return None

def poll_latest_data(interval_seconds=5):
    """
    Continuously polls the endpoint. Detects new data by comparing 
    the x-goog-generation header.
    """
    print(f"Starting continuous polling (Interval: {interval_seconds}s)...")
    print(f"Endpoint: {BASE_URL}\n")
    print("Waiting for new data...")
    
    last_generation = None
    
    while True:
        telemetry = fetch_telemetry()
        
        if telemetry:
            current_generation = telemetry["generation_header"]
            
            # Check if the generation header has changed
            if current_generation != last_generation:
                print(f"\n[+] New Data Detected! (Generation: {current_generation})")
                print(f"    Timestamp (Param 5010): {telemetry['snapshot_timestamp']}")
                print(f"    Position (X,Y,Z): {telemetry['position_m']['X']}, {telemetry['position_m']['Y']}, {telemetry['position_m']['Z']}")
                print(f"    Velocity (X,Y,Z): {telemetry['velocity_ms']['X']}, {telemetry['velocity_ms']['Y']}, {telemetry['velocity_ms']['Z']}")
                print(f"    Attitude (q1-q4): {telemetry['attitude_quaternion']['q1']}, {telemetry['attitude_quaternion']['q2']}, {telemetry['attitude_quaternion']['q3']}, {telemetry['attitude_quaternion']['q4']}")
                
                # Update the baseline generation to the new one
                last_generation = current_generation
                
        time.sleep(interval_seconds)

if __name__ == "__main__":
    try:
        poll_latest_data(interval_seconds=5)
    except KeyboardInterrupt:
        print("\nPolling stopped by user.")