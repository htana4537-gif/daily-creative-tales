import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { History, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Message {
  id: string;
  character_name: string;
  voice_type: string;
  scenes_count: number;
  duration: number;
  sent_at: string;
  status: string;
}

interface MessagesHistoryProps {
  refreshTrigger: number;
}

export function MessagesHistory({ refreshTrigger }: MessagesHistoryProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, [refreshTrigger]);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-messages');
      if (error) throw error;
      if (data?.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          سجل الرسائل
          <span className="text-sm font-normal text-muted-foreground">
            ({messages.length} رسالة)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-2 opacity-50" />
            <p>لا توجد رسائل مُرسلة بعد</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الشخصية</TableHead>
                <TableHead>الصوت</TableHead>
                <TableHead>المشاهد</TableHead>
                <TableHead>المدة</TableHead>
                <TableHead>التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((msg) => (
                <TableRow key={msg.id}>
                  <TableCell className="font-medium">{msg.character_name}</TableCell>
                  <TableCell>{msg.voice_type === 'male_arabic' ? 'ذكر' : 'أنثى'}</TableCell>
                  <TableCell>{msg.scenes_count}</TableCell>
                  <TableCell>{msg.duration}ث</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(msg.sent_at), 'dd MMM yyyy - HH:mm', { locale: ar })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
