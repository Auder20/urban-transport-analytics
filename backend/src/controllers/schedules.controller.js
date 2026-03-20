const pool = require('../config/database')
const { z } = require('zod')

const createScheduleSchema = z.object({
  routeId: z.string().uuid('Invalid route ID'),
  busId: z.string().uuid('Invalid bus ID').optional(),
  scheduledStart: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM required'),
  scheduledEnd: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM required'),
  dayOfWeek: z.array(z.number().int().min(1).max(7)).min(1),
  frequencyMin: z.number().int().min(5).max(120).default(15)
})

const updateScheduleSchema = createScheduleSchema.partial()

class SchedulesController {
  async getAllSchedules(req, res) {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const offset = (page - 1) * limit
    const routeId = req.query.route_id
    const activeOnly = req.query.active !== 'false'

    let where = 'WHERE s.is_active = $1'
    let params = [activeOnly, limit, offset]
    let idx = 4

    if (routeId) {
      where += ` AND s.route_id = $${idx++}` 
      params = [activeOnly, routeId, limit, offset]
    }

    const query = `
      SELECT s.id, s.route_id, s.bus_id, s.scheduled_start, s.scheduled_end,
             s.day_of_week, s.frequency_min, s.is_active,
             r.route_code, r.name as route_name, r.color as route_color,
             b.plate_number as bus_plate
      FROM schedules s
      JOIN routes r ON s.route_id = r.id
      LEFT JOIN buses b ON s.bus_id = b.id
      ${where}
      ORDER BY r.route_code, s.scheduled_start
      LIMIT $${routeId ? 3 : 2} OFFSET $${routeId ? 4 : 3}
    `

    const countQuery = `SELECT COUNT(*) FROM schedules s ${where}` 

    const [result, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2))
    ])

    res.json({
      schedules: result.rows.map(s => ({
        id: s.id,
        routeId: s.route_id,
        busId: s.bus_id,
        scheduledStart: s.scheduled_start,
        scheduledEnd: s.scheduled_end,
        dayOfWeek: s.day_of_week,
        frequencyMin: s.frequency_min,
        isActive: s.is_active,
        route: { code: s.route_code, name: s.route_name, color: s.route_color },
        bus: s.bus_plate ? { plateNumber: s.bus_plate } : null
      })),
      pagination: { page, limit, total: parseInt(countResult.rows[0].count), pages: Math.ceil(countResult.rows[0].count / limit) }
    })
  }

  async getScheduleById(req, res) {
    const result = await pool.query(
      `SELECT s.*, r.route_code, r.name as route_name, r.color as route_color, b.plate_number as bus_plate
       FROM schedules s
       JOIN routes r ON s.route_id = r.id
       LEFT JOIN buses b ON s.bus_id = b.id
       WHERE s.id = $1`,
      [req.params.id]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Schedule not found' })
    const s = result.rows[0]
    res.json({
      id: s.id, routeId: s.route_id, busId: s.bus_id,
      scheduledStart: s.scheduled_start, scheduledEnd: s.scheduled_end,
      dayOfWeek: s.day_of_week, frequencyMin: s.frequency_min, isActive: s.is_active,
      route: { code: s.route_code, name: s.route_name, color: s.route_color },
      bus: s.bus_plate ? { plateNumber: s.bus_plate } : null
    })
  }

  async getRouteSchedules(req, res) {
    const result = await pool.query(
      `SELECT s.*, b.plate_number as bus_plate
       FROM schedules s
       LEFT JOIN buses b ON s.bus_id = b.id
       WHERE s.route_id = $1 AND s.is_active = true
       ORDER BY s.scheduled_start`,
      [req.params.routeId]
    )
    res.json({ schedules: result.rows })
  }

  async createSchedule(req, res) {
    const data = createScheduleSchema.parse(req.body)
    const result = await pool.query(
      `INSERT INTO schedules (route_id, bus_id, scheduled_start, scheduled_end, day_of_week, frequency_min)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [data.routeId, data.busId || null, data.scheduledStart, data.scheduledEnd, data.dayOfWeek, data.frequencyMin]
    )
    res.status(201).json(result.rows[0])
  }

  async updateSchedule(req, res) {
    const data = updateScheduleSchema.parse(req.body)
    const fields = []
    const values = []
    let idx = 1
    if (data.busId !== undefined) { fields.push(`bus_id = $${idx++}`); values.push(data.busId) }
    if (data.scheduledStart) { fields.push(`scheduled_start = $${idx++}`); values.push(data.scheduledStart) }
    if (data.scheduledEnd) { fields.push(`scheduled_end = $${idx++}`); values.push(data.scheduledEnd) }
    if (data.dayOfWeek) { fields.push(`day_of_week = $${idx++}`); values.push(data.dayOfWeek) }
    if (data.frequencyMin) { fields.push(`frequency_min = $${idx++}`); values.push(data.frequencyMin) }
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' })
    values.push(req.params.id)
    const result = await pool.query(
      `UPDATE schedules SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Schedule not found' })
    res.json(result.rows[0])
  }

  async deleteSchedule(req, res) {
    const result = await pool.query(
      'UPDATE schedules SET is_active = false WHERE id = $1 RETURNING id',
      [req.params.id]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Schedule not found' })
    res.json({ message: 'Schedule deactivated' })
  }

  async activateSchedule(req, res) {
    const result = await pool.query(
      'UPDATE schedules SET is_active = true WHERE id = $1 RETURNING id',
      [req.params.id]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Schedule not found' })
    res.json({ message: 'Schedule activated' })
  }

  async deactivateSchedule(req, res) {
    return this.deleteSchedule(req, res)
  }
}

module.exports = new SchedulesController()
