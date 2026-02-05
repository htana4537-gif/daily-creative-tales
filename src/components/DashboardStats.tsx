import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Calendar, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStatsProps {
  refreshTrigger: number;
}

export function DashboardStats({ refreshTrigger }: DashboardStatsProps) {
  const [totalMessages, setTotalMessages] = useState(0);
  const [todayMessages, setTodayMessages] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    loadStats();
  }, [refreshTrigger]);

  const loadStats = async () => {
    // Total messages
    const { count: total } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });
    setTotalMessages(total || 0);

    // Today's messages
    const today = new Date().toISOString().split('T')[0];
    const { count: todayCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .gte('sent_at', today);
    setTodayMessages(todayCount || 0);

    // Check connection
    const { data: settings } = await supabase
      .from('telegram_settings')
      .select('bot_token')
      .limit(1)
      .single();
    setIsConnected(!!settings?.bot_token);
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="rounded-full bg-primary/20 p-3">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">إجمالي الرسائل</p>
            <p className="text-3xl font-bold">{totalMessages}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="rounded-full bg-green-500/20 p-3">
            <Calendar className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">رسائل اليوم</p>
            <p className="text-3xl font-bold">{todayMessages}</p>
          </div>
        </CardContent>
      </Card>

      <Card className={`bg-gradient-to-br ${isConnected ? 'from-emerald-500/10 to-emerald-500/5' : 'from-orange-500/10 to-orange-500/5'}`}>
        <CardContent className="flex items-center gap-4 p-6">
          <div className={`rounded-full p-3 ${isConnected ? 'bg-emerald-500/20' : 'bg-orange-500/20'}`}>
            <Zap className={`h-6 w-6 ${isConnected ? 'text-emerald-500' : 'text-orange-500'}`} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">حالة الاتصال</p>
            <p className={`text-lg font-bold ${isConnected ? 'text-emerald-500' : 'text-orange-500'}`}>
              {isConnected ? 'متصل' : 'غير متصل'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
