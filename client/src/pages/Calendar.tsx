import { useState } from 'react';
import { trpc } from '../trpc';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const LEAVE_COLORS: Record<string, string> = {
  'Normal Leave': 'bg-blue-200 text-blue-800',
  'Study / Exam Leave': 'bg-purple-200 text-purple-800',
  'Family Responsibility': 'bg-green-200 text-green-800',
};

export default function Calendar() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const calendarData = trpc.leave.calendar.useQuery({ month, year });

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();

  const getLeavesForDate = (day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return ((calendarData.data || []) as any[]).filter((l: any) => l.startDate <= dateStr && l.endDate >= dateStr);
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg text-xl">←</button>
        <h2 className="text-xl font-bold text-gray-800">{MONTH_NAMES[month - 1]} {year}</h2>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg text-xl">→</button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(LEAVE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5 text-xs">
            <span className={`w-3 h-3 rounded ${color.split(' ')[0]}`}></span>
            <span className="text-gray-600">{type}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {DAY_NAMES.map(d => (
            <div key={d} className="p-3 text-center text-sm font-semibold text-gray-600">{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-gray-100 bg-gray-50/50"></div>
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const leaves = getLeavesForDate(day);
            const dayOfWeek = new Date(year, month - 1, day).getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            return (
              <div
                key={day}
                className={`min-h-[100px] border-b border-r border-gray-100 p-1.5 ${
                  isWeekend ? 'bg-gray-50' : ''
                } ${isToday(day) ? 'ring-2 ring-inset ring-blue-500' : ''}`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isToday(day) ? 'text-blue-600 font-bold' : isWeekend ? 'text-gray-400' : 'text-gray-700'
                }`}>
                  {day}
                </div>
                <div className="space-y-0.5">
                  {leaves.map((l: any) => (
                    <div
                      key={l.id}
                      className={`text-xs px-1.5 py-0.5 rounded truncate ${LEAVE_COLORS[l.leaveType] || 'bg-gray-200 text-gray-700'}`}
                      title={`${l.preferredName || l.firstName} ${l.lastName} - ${l.leaveType}`}
                    >
                      {l.preferredName || l.firstName}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
