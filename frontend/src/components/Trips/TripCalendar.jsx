import { useState } from 'react'
import {
  startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, format, isSameDay, isToday, addMonths, subMonths
} from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react'

export default function TripCalendar({ 
  currentMonth, 
  setCurrentMonth, 
  calendarTrips,
  onTripClick 
}) {
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getTripsForDay = (day) =>
    calendarTrips.filter(t => isSameDay(new Date(t.startedAt), day))

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const startDayOfWeek = getDay(monthStart)

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
        {weekDays.map(day => (
          <div key={day} className="bg-gray-50 p-2 text-center text-xs font-medium text-gray-700">
            {day}
          </div>
        ))}
        
        {/* Empty cells for days before month starts */}
        {Array.from({ length: startDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="bg-white p-2 min-h-[80px]" />
        ))}
        
        {/* Days of the month */}
        {daysInMonth.map(day => {
          const dayTrips = getTripsForDay(day)
          const isCurrentDay = isToday(day)
          
          return (
            <div
              key={day.toString()}
              className={`bg-white p-2 min-h-[80px] border border-gray-100 ${
                isCurrentDay ? 'bg-blue-50' : ''
              }`}
            >
              <div className={`text-sm font-medium mb-1 ${
                isCurrentDay ? 'text-blue-600' : 'text-gray-900'
              }`}>
                {format(day, 'd')}
              </div>
              
              <div className="space-y-1">
                {dayTrips.slice(0, 2).map(trip => (
                  <div
                    key={trip.id}
                    onClick={() => onTripClick(trip)}
                    className="text-xs p-1 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                    style={{
                      backgroundColor: trip.status === 'completed' ? '#10b981' :
                                       trip.status === 'in_progress' ? '#3b82f6' :
                                       trip.status === 'cancelled' ? '#ef4444' :
                                       trip.status === 'delayed' ? '#f59e0b' : '#6b7280',
                      color: 'white'
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span className="truncate">{format(new Date(trip.startedAt), 'HH:mm')}</span>
                    </div>
                    <div className="truncate">{trip.routeName}</div>
                  </div>
                ))}
                
                {dayTrips.length > 2 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayTrips.length - 2} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Cancelled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span>Delayed</span>
        </div>
      </div>
    </div>
  )
}
