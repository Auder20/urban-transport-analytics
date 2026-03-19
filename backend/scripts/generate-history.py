#!/usr/bin/env python3
"""
Generate 90 days of historical trip data with realistic delays
"""

import random
import psycopg2
from datetime import datetime, timedelta
import math
import sys

# Database connection
DB_URL = "postgresql://uta:secret@localhost:5432/uta_db"

def get_db_connection():
    """Get database connection"""
    try:
        conn = psycopg2.connect(DB_URL)
        return conn
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        sys.exit(1)

def generate_delay_minutes(hour: int, day_of_week: int) -> int:
    """
    Generate realistic delay minutes based on time patterns
    
    Args:
        hour: Hour of day (0-23)
        day_of_week: Day of week (0=Monday, 6=Sunday)
    
    Returns:
        Delay in minutes
    """
    # Base delay varies by time of day
    if 7 <= hour <= 9:  # Morning peak (7-9 AM)
        base_delay = random.gauss(12, 6)
    elif 17 <= hour <= 19:  # Evening peak (5-7 PM)
        base_delay = random.gauss(10, 5)
    elif 12 <= hour <= 14:  # Lunch time
        base_delay = random.gauss(5, 3)
    elif 22 <= hour or hour <= 5:  # Night/early morning
        base_delay = random.gauss(2, 2)
    else:  # Off-peak
        base_delay = random.gauss(3, 4)
    
    # Weekend adjustment (less traffic)
    if day_of_week >= 5:  # Saturday, Sunday
        base_delay *= 0.6
    
    # Add some randomness for events
    if random.random() < 0.05:  # 5% chance of incident
        base_delay += random.uniform(15, 45)
    
    # Ensure delay is non-negative and reasonable
    delay = max(0, base_delay)
    return min(int(delay), 120)  # Cap at 2 hours

def generate_passenger_count(hour: int, capacity: int) -> int:
    """
    Generate realistic passenger count based on time and capacity
    
    Args:
        hour: Hour of day (0-23)
        capacity: Bus capacity
    
    Returns:
        Passenger count
    """
    # Peak hours have higher occupancy
    if 7 <= hour <= 9 or 17 <= hour <= 19:
        occupancy_rate = random.uniform(0.7, 1.0)
    elif 12 <= hour <= 14:
        occupancy_rate = random.uniform(0.4, 0.8)
    else:
        occupancy_rate = random.uniform(0.2, 0.6)
    
    return int(capacity * occupancy_rate)

def seed_trips(conn, n_days: int = 90):
    """
    Generate historical trip data
    
    Args:
        conn: Database connection
        n_days: Number of days to generate
    """
    cursor = conn.cursor()
    
    print(f"🔄 Generating {n_days} days of historical trip data...")
    
    # Get existing data
    cursor.execute("SELECT id, route_id, bus_id, capacity FROM buses WHERE status = 'active'")
    buses = cursor.fetchall()
    
    cursor.execute("SELECT id, route_id FROM routes WHERE status = 'active'")
    routes = cursor.fetchall()
    
    if not buses or not routes:
        print("❌ No active buses or routes found")
        return
    
    print(f"📊 Found {len(buses)} buses and {len(routes)} routes")
    
    # Create route mapping
    route_map = {route[1]: route[0] for route in routes}
    
    # Generate trips for each day
    total_trips = 0
    start_date = datetime.now() - timedelta(days=n_days)
    
    for day_offset in range(n_days):
        current_date = start_date + timedelta(days=day_offset)
        day_of_week = current_date.weekday()  # 0=Monday, 6=Sunday
        
        print(f"📅 Generating data for {current_date.strftime('%Y-%m-%d')} (Day {day_offset + 1}/{n_days})")
        
        # Skip weekends for fewer trips
        daily_trips_target = 300 if day_of_week < 5 else 150
        
        for hour in range(5, 23):  # 5 AM to 11 PM
            # More trips during peak hours
            if 7 <= hour <= 9 or 17 <= hour <= 19:
                trips_per_hour = int(daily_trips_target * 0.15 / 8)  # 15% of daily trips per peak hour
            else:
                trips_per_hour = int(daily_trips_target * 0.05 / 13)  # 5% per off-peak hour
            
            # Generate trips for this hour
            for trip_num in range(trips_per_hour):
                # Random bus and route
                bus = random.choice(buses)
                route_id = bus[1]  # bus's current route
                
                if not route_id or route_id not in route_map:
                    continue
                
                # Calculate scheduled and actual times
                scheduled_minute = random.randint(0, 59)
                scheduled_time = current_date.replace(hour=hour, minute=scheduled_minute, second=0, microsecond=0)
                
                delay_minutes = generate_delay_minutes(hour, day_of_week)
                actual_time = scheduled_time + timedelta(minutes=delay_minutes)
                
                # Generate passenger count
                passenger_count = generate_passenger_count(hour, bus[2] or 80)
                
                # Insert trip
                cursor.execute("""
                    INSERT INTO trips (
                        bus_id, route_id, driver_id, started_at, ended_at, 
                        scheduled_start, passenger_count, status
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                """, (
                    bus[0],  # bus_id
                    route_map[route_id],  # route_id
                    None,  # driver_id (can be null)
                    actual_time,  # started_at
                    actual_time + timedelta(hours=1),  # ended_at (1 hour trip)
                    scheduled_time,  # scheduled_start
                    passenger_count,  # passenger_count
                    'completed'  # status
                ))
                
                total_trips += 1
        
        # Commit every 5 days to avoid large transactions
        if (day_offset + 1) % 5 == 0:
            conn.commit()
            print(f"💾 Committed {total_trips} trips so far")
    
    # Final commit
    conn.commit()
    
    print(f"✅ Generated {total_trips} historical trips over {n_days} days")
    
    # Generate statistics
    cursor.execute("""
        SELECT 
            COUNT(*) as total_trips,
            AVG(delay_minutes) as avg_delay,
            COUNT(CASE WHEN delay_minutes <= 5 THEN 1 END) * 100.0 / COUNT(*) as on_time_pct,
            COUNT(CASE WHEN delay_minutes > 15 THEN 1 END) * 100.0 / COUNT(*) as delayed_pct
        FROM trips
        WHERE started_at >= %s
    """, (start_date,))
    
    stats = cursor.fetchone()
    
    print(f"\n📈 Generated Statistics:")
    print(f"   Total trips: {stats[0]:,}")
    print(f"   Average delay: {stats[1]:.1f} minutes")
    print(f"   On-time percentage: {stats[2]:.1f}%")
    print(f"   Delayed percentage: {stats[3]:.1f}%")

def generate_gps_logs(conn, n_days: int = 7):
    """
    Generate GPS logs for recent trips
    
    Args:
        conn: Database connection
        n_days: Number of days to generate GPS logs for
    """
    cursor = conn.cursor()
    
    print(f"📍 Generating GPS logs for last {n_days} days...")
    
    # Get recent trips
    cursor.execute("""
        SELECT id, bus_id, route_id, started_at, ended_at 
        FROM trips 
        WHERE started_at >= NOW() - INTERVAL '%s days'
        ORDER BY started_at DESC
        LIMIT 1000
    """, (n_days,))
    
    trips = cursor.fetchall()
    
    if not trips:
        print("❌ No recent trips found")
        return
    
    print(f"📊 Found {len(trips)} recent trips")
    
    # Get MongoDB connection for GPS logs
    try:
        from pymongo import MongoClient
        mongo_client = MongoClient('mongodb://localhost:27017')
        mongo_db = mongo_client.uta_logs
        gps_collection = mongo_db.gps_logs
        
        total_logs = 0
        
        for trip in trips:
            trip_id, bus_id, route_id, started_at, ended_at = trip
            
            # Generate GPS points every 2 minutes during the trip
            current_time = started_at
            while current_time < ended_at:
                # Generate position (simplified - would use actual route data)
                lat = 4.7110 + (random.random() - 0.5) * 0.1
                lng = -74.0721 + (random.random() - 0.5) * 0.1
                
                # Random speed and other data
                speed_kmh = random.uniform(15, 50)
                heading = random.uniform(0, 360)
                occupancy_pct = random.uniform(20, 90)
                
                gps_log = {
                    'bus_id': str(bus_id),
                    'route_id': str(route_id),
                    'timestamp': current_time,
                    'location': {
                        'type': 'Point',
                        'coordinates': [lng, lat]
                    },
                    'speed_kmh': speed_kmh,
                    'heading': heading,
                    'altitude_m': random.uniform(2500, 2600),
                    'accuracy_m': random.uniform(5, 15),
                    'occupancy_pct': occupancy_pct,
                    'engine_status': random.choice(['on', 'idle']),
                    'odometer_km': random.uniform(10000, 50000)
                }
                
                gps_collection.insert_one(gps_log)
                total_logs += 1
                
                # Move to next time point
                current_time += timedelta(minutes=2)
        
        print(f"✅ Generated {total_logs} GPS logs")
        
        mongo_client.close()
        
    except ImportError:
        print("⚠️ pymongo not installed, skipping GPS logs")
    except Exception as e:
        print(f"❌ Failed to generate GPS logs: {e}")

def main():
    """Main function"""
    print("🚀 Starting historical data generation...")
    
    conn = get_db_connection()
    
    try:
        # Generate trips
        seed_trips(conn, n_days=90)
        
        # Generate GPS logs
        generate_gps_logs(conn, n_days=7)
        
        print("\n🎉 Historical data generation completed!")
        print("📊 Database is now populated with realistic historical data")
        
    except Exception as e:
        print(f"❌ Error during data generation: {e}")
        conn.rollback()
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    main()
