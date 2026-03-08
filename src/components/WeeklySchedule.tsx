import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface WeeklyScheduleProps {
  frequency: string;
  count: number;
  time: string;
  enabled: boolean;
}

const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export function WeeklySchedule({ frequency, count, time, enabled }: WeeklyScheduleProps) {
  if (!enabled) return null;

  const dailyCount = frequency === 'daily'
    ? count
    : Math.max(1, Math.ceil(count / 7));

  const totalWeekly = frequency === 'daily' ? count * 7 : count;

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4" />
          الجدول الزمني للإرسال
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">إجمالي الأسبوع</span>
          <Badge variant="secondary">{totalWeekly} رسالة</Badge>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {DAYS_AR.map((day, i) => {
            const today = new Date().getDay();
            const isToday = i === today;

            return (
              <div
                key={day}
                className={`flex flex-col items-center gap-1 rounded-lg p-2 text-center transition-colors ${
                  isToday
                    ? 'bg-primary/10 ring-1 ring-primary/30'
                    : 'bg-muted/40'
                }`}
              >
                <span className={`text-[10px] font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                  {day.slice(0, 5)}
                </span>
                <div className="flex flex-col items-center gap-0.5">
                  {Array.from({ length: Math.min(dailyCount, 5) }).map((_, j) => (
                    <Send
                      key={j}
                      className={`h-2.5 w-2.5 ${isToday ? 'text-primary' : 'text-muted-foreground/60'}`}
                    />
                  ))}
                  {dailyCount > 5 && (
                    <span className="text-[8px] text-muted-foreground">+{dailyCount - 5}</span>
                  )}
                </div>
                <span className="text-[9px] text-muted-foreground">{dailyCount}</span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>يبدأ الإرسال من الساعة {time} (كل ساعة حتى اكتمال العدد)</span>
        </div>
      </CardContent>
    </Card>
  );
}
