'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface DatePickerProps {
  value: Date | undefined;
  onChange: (date: Date) => void;
  placeholder?: string;
}

export function DatePicker({ value, onChange, placeholder = 'Select date' }: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [year, setYear] = React.useState<number>(value?.getFullYear() || new Date().getFullYear());
  const [month, setMonth] = React.useState<number>(value?.getMonth() || new Date().getMonth());
  const [selectedDay, setSelectedDay] = React.useState<number | null>(value?.getDate() || null);

  // Get the number of days in the current month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get the day of the week of the first day of the month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const handleDaySelect = (day: number) => {
    setSelectedDay(day);
    const selectedDate = new Date(year, month, day);
    onChange(selectedDate);
    setIsOpen(false);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);

  // Create grid of days
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null); // Empty cells for days of the previous month
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, 'PPP') : placeholder}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select a date</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <Button variant="outline" size="sm" onClick={handlePrevMonth}>
              &lt;
            </Button>
            <div className="font-medium">
              {monthNames[month]} {year}
            </div>
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              &gt;
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-sm font-medium">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <div key={index}>
                {day !== null ? (
                  <Button
                    variant={selectedDay === day ? 'default' : 'outline'}
                    className="w-full h-10"
                    onClick={() => handleDaySelect(day)}
                  >
                    {day}
                  </Button>
                ) : (
                  <div className="w-full h-10"></div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4">
            <Input
              type="date"
              onChange={e => {
                if (e.target.value) {
                  const date = new Date(e.target.value);
                  setYear(date.getFullYear());
                  setMonth(date.getMonth());
                  setSelectedDay(date.getDate());
                  onChange(date);
                  setIsOpen(false);
                }
              }}
              className="hidden sm:block"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
