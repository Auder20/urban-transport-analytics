#!/usr/bin/env python3
"""
generate-history.py
Script para generar datos históricos de viajes para los últimos 180 días
con variaciones realistas basadas en patrones de transporte urbano
"""

import os
import sys
import random
import psycopg2
from psycopg2 import sql, extras
from datetime import datetime, timedelta
import math

# Configuración de base de datos
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://uta:secret@localhost:5432/uta_db')

def get_db_connection():
    """Establecer conexión con PostgreSQL"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"❌ Error conectando a PostgreSQL: {e}")
        sys.exit(1)

def get_existing_data(conn):
    """Obtener datos existentes de rutas, buses y usuarios"""
    with conn.cursor() as cur:
        # Obtener rutas
        cur.execute("SELECT id, route_code FROM routes WHERE status = 'active'")
        routes = cur.fetchall()
        route_ids = [row[0] for row in routes]
        route_codes = [row[1] for row in routes]
        
        # Obtener buses
        cur.execute("SELECT id, plate_number, capacity FROM buses WHERE status = 'active'")
        buses = cur.fetchall()
        bus_ids = [row[0] for row in buses]
        bus_capacities = {row[0]: row[2] for row in buses}
        
        # Obtener conductores (usuarios operadores y admin)
        cur.execute("SELECT id FROM users WHERE role IN ('operator', 'admin')")
        drivers = cur.fetchall()
        driver_ids = [row[0] for row in drivers]
        
        return {
            'route_ids': route_ids,
            'route_codes': route_codes,
            'bus_ids': bus_ids,
            'bus_capacities': bus_capacities,
            'driver_ids': driver_ids
        }

def is_peak_hour(hour):
    """Determinar si una hora es hora pico"""
    return (7 <= hour <= 9) or (12 <= hour <= 14) or (17 <= hour <= 19)

def is_weekend(date):
    """Determinar si es fin de semana"""
    return date.weekday() >= 5

def get_passenger_count(base_capacity, hour, is_weekend_day):
    """Calcular número de pasajeros realista según hora y día"""
    # Base capacity factor
    base_factor = 0.3 + random.random() * 0.4  # 30-70% de capacidad base
    
    # Ajuste por hora pico
    if is_peak_hour(hour):
        base_factor *= 1.5 + random.random() * 0.5  # 75-150% en hora pico
    elif hour < 6 or hour > 21:
        base_factor *= 0.3 + random.random() * 0.2  # 9-18% en horarios nocturnos
    
    # Ajuste por fin de semana
    if is_weekend_day:
        base_factor *= 0.7 + random.random() * 0.3  # 21-63% los fines de semana
    
    passenger_count = int(base_capacity * base_factor)
    return max(1, min(passenger_count, base_capacity))

def get_delay_probability(day_of_week, hour):
    """Calcular probabilidad de retraso según día y hora"""
    base_prob = 0.15  # 15% base de retraso
    
    # Más retrasos lunes y viernes
    if day_of_week == 0 or day_of_week == 4:  # Lunes o viernes
        base_prob += 0.1
    
    # Más retrasos en hora pico
    if is_peak_hour(hour):
        base_prob += 0.15
    
    # Menos retrasos en fin de semana
    if day_of_week >= 5:
        base_prob -= 0.05
    
    return min(base_prob, 0.4)  # Máximo 40% de probabilidad

def generate_historical_trips(conn, data, days=180):
    """Generar viajes históricos para los últimos días especificados"""
    print(f"📊 Generando viajes históricos para los últimos {days} días...")
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    trips_generated = 0
    
    with conn.cursor() as cur:
        # Deshabilitar triggers para mejor rendimiento
        cur.execute("ALTER TABLE trips DISABLE TRIGGER ALL")
        
        try:
            current_date = start_date
            batch_size = 1000
            trips_batch = []
            
            while current_date <= end_date:
                day_of_week = current_date.weekday()
                is_weekend_day = is_weekend(current_date)
                
                # Número de viajes por día (menos los domingos)
                if day_of_week == 6:  # Domingo
                    daily_trips = random.randint(8, 15)
                elif is_weekend_day:  # Sábado
                    daily_trips = random.randint(12, 20)
                else:  # Día laboral
                    daily_trips = random.randint(15, 25)
                
                for trip_num in range(daily_trips):
                    # Seleccionar ruta y bus aleatorios
                    route_id = random.choice(data['route_ids'])
                    bus_id = random.choice(data['bus_ids'])
                    driver_id = random.choice(data['driver_ids'])
                    capacity = data['bus_capacities'][bus_id]
                    
                    # Generar hora de salida (distribución realista)
                    if is_weekend_day:
                        # Fines de semana: distribución más uniforme
                        hour = random.randint(6, 22)
                        minute = random.randint(0, 59)
                    else:
                        # Días laborales: concentración en horas pico
                        hour_choices = list(range(5, 23))
                        hour_weights = [
                            0.3,  # 5am
                            0.8,  # 6am
                            1.5,  # 7am (pico)
                            1.8,  # 8am (pico)
                            1.2,  # 9am (pico)
                            0.6,  # 10am
                            0.5,  # 11am
                            0.9,  # 12pm (pico)
                            1.3,  # 1pm (pico)
                            1.1,  # 2pm (pico)
                            0.7,  # 3pm
                            0.6,  # 4pm
                            1.4,  # 5pm (pico)
                            1.7,  # 6pm (pico)
                            1.3,  # 7pm (pico)
                            0.8,  # 8pm
                            0.5,  # 9pm
                            0.3,  # 10pm
                            0.2,  # 11pm
                        ]
                        hour = random.choices(hour_choices, weights=hour_weights)[0]
                        minute = random.randint(0, 59)
                    
                    # Crear timestamps
                    scheduled_start = current_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
                    
                    # Determinar si habrá retraso
                    delay_prob = get_delay_probability(day_of_week, hour)
                    has_delay = random.random() < delay_prob
                    
                    if has_delay:
                        delay_minutes = random.randint(5, 45)
                        actual_start = scheduled_start + timedelta(minutes=delay_minutes)
                    else:
                        delay_minutes = random.randint(-2, 5)  # Pequeños adelantos o a tiempo
                        actual_start = scheduled_start + timedelta(minutes=delay_minutes)
                    
                    # Duración del viaje (30-90 minutos dependiendo de la ruta)
                    travel_duration = random.randint(30, 90)
                    actual_end = actual_start + timedelta(minutes=travel_duration)
                    
                    # Pasajeros
                    passenger_count = get_passenger_count(capacity, hour, is_weekend_day)
                    
                    # Estado del viaje
                    if actual_end > datetime.now():
                        status = 'scheduled'
                    elif random.random() < 0.02:  # 2% cancelados
                        status = 'cancelled'
                        actual_end = None
                        passenger_count = 0
                    elif actual_end > datetime.now() - timedelta(hours=2):
                        status = 'in_progress'
                        actual_end = None
                    else:
                        status = 'completed'
                    
                    # Agregar a batch
                    trip_data = (
                        bus_id,
                        route_id,
                        driver_id,
                        scheduled_start,
                        actual_start if status != 'cancelled' else None,
                        actual_end,
                        passenger_count,
                        status
                    )
                    trips_batch.append(trip_data)
                    
                    # Insertar batch cuando alcance el tamaño
                    if len(trips_batch) >= batch_size:
                        extras.execute_batch(
                            cur,
                            """
                            INSERT INTO trips (bus_id, route_id, driver_id, scheduled_start, started_at, ended_at, passenger_count, status)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                            ON CONFLICT DO NOTHING
                            """,
                            trips_batch
                        )
                        trips_generated += len(trips_batch)
                        trips_batch = []
                        print(f"   ✅ {trips_generated} viajes generados...")
                
                current_date += timedelta(days=1)
            
            # Insertar remaining trips
            if trips_batch:
                extras.execute_batch(
                    cur,
                    """
                    INSERT INTO trips (bus_id, route_id, driver_id, scheduled_start, started_at, ended_at, passenger_count, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT DO NOTHING
                    """,
                    trips_batch
                )
                trips_generated += len(trips_batch)
        
        finally:
            # Rehabilitar triggers
            cur.execute("ALTER TABLE trips ENABLE TRIGGER ALL")
    
    return trips_generated

def update_statistics(conn):
    """Actualizar estadísticas de la base de datos"""
    print("📈 Actualizando estadísticas...")
    
    with conn.cursor() as cur:
        # Actualizar conteos de estaciones por ruta
        cur.execute("""
            UPDATE routes 
            SET total_stops = (
                SELECT COUNT(*) 
                FROM route_stations 
                WHERE route_id = routes.id
            )
        """)
        
        # Actualizar estadísticas de viajes
        cur.execute("ANALYZE trips")
        cur.execute("ANALYZE routes")
        cur.execute("ANALYZE buses")

def main():
    """Función principal"""
    print("🚀 Iniciando generación de datos históricos...")
    
    try:
        conn = get_db_connection()
        conn.autocommit = False
        
        print("✅ Conectado a la base de datos")
        
        # Obtener datos existentes
        data = get_existing_data(conn)
        print(f"   📊 {len(data['route_ids'])} rutas encontradas")
        print(f"   🚌 {len(data['bus_ids'])} buses encontrados")
        print(f"   👤 {len(data['driver_ids'])} conductores encontrados")
        
        if not data['route_ids'] or not data['bus_ids'] or not data['driver_ids']:
            print("❌ No hay datos suficientes en la base de datos. Ejecuta primero seed-db.js")
            sys.exit(1)
        
        # Generar viajes históricos
        trips_count = generate_historical_trips(conn, data, days=180)
        
        # Actualizar estadísticas
        update_statistics(conn)
        
        # Confirmar transacción
        conn.commit()
        
        print("\n🎉 GENERACIÓN DE DATOS HISTÓRICOS COMPLETADA")
        print("=" * 50)
        print(f"📊 Viajes históricos generados: {trips_count}")
        print(f"📅 Período: Últimos 180 días")
        print(f"📈 Promedio diario: {trips_count / 180:.1f} viajes/día")
        print("=" * 50)
        
        # Mostrar resumen de distribución
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    status,
                    COUNT(*) as count,
                    ROUND(COUNT(*)::float / (SELECT COUNT(*) FROM trips) * 100, 1) as percentage
                FROM trips 
                GROUP BY status
                ORDER BY count DESC
            """)
            
            print("\n📊 Distribución de estados de viajes:")
            for row in cur.fetchall():
                print(f"   {row[0]}: {row[1]} ({row[2]}%)")
            
            cur.execute("""
                SELECT 
                    DATE_TRUNC('day', scheduled_start) as date,
                    COUNT(*) as count
                FROM trips 
                WHERE scheduled_start >= CURRENT_DATE - INTERVAL '7 days'
                GROUP BY DATE_TRUNC('day', scheduled_start)
                ORDER BY date DESC
                LIMIT 7
            """)
            
            print("\n📈 Viajes de los últimos 7 días:")
            for row in cur.fetchall():
                print(f"   {row[0].strftime('%Y-%m-%d')}: {row[1]} viajes")
        
    except Exception as e:
        print(f"❌ Error durante la generación: {e}")
        if 'conn' in locals():
            conn.rollback()
        sys.exit(1)
    
    finally:
        if 'conn' in locals():
            conn.close()
            print("✅ Conexión cerrada")

if __name__ == "__main__":
    main()
