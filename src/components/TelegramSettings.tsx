import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, TestTube, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function TelegramSettings() {
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [autoSendEnabled, setAutoSendEnabled] = useState(false);
  const [autoSendTime, setAutoSendTime] = useState('09:00');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase
      .from('telegram_settings')
      .select('*')
      .limit(1)
      .single();

    if (data) {
      setBotToken(data.bot_token);
      setChatId(data.chat_id);
      setAutoSendEnabled(data.auto_send_enabled);
      setAutoSendTime(data.auto_send_time?.slice(0, 5) || '09:00');
      setConnectionStatus('connected');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: existing } = await supabase
        .from('telegram_settings')
        .select('id')
        .limit(1)
        .single();

      const settings = {
        bot_token: botToken,
        chat_id: chatId,
        auto_send_enabled: autoSendEnabled,
        auto_send_time: autoSendTime + ':00',
      };

      if (existing) {
        await supabase
          .from('telegram_settings')
          .update(settings)
          .eq('id', existing.id);
      } else {
        await supabase.from('telegram_settings').insert(settings);
      }

      toast({
        title: 'تم الحفظ ✓',
        description: 'تم حفظ إعدادات تلجرام بنجاح',
      });
      setConnectionStatus('connected');
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const { error } = await supabase.functions.invoke('test-telegram', {
        body: { botToken, chatId },
      });

      if (error) throw error;

      toast({
        title: 'نجح الاختبار! ✓',
        description: 'تم إرسال رسالة اختبار إلى تلجرام',
      });
      setConnectionStatus('connected');
    } catch (error: any) {
      toast({
        title: 'فشل الاختبار',
        description: error.message || 'تأكد من صحة البيانات',
        variant: 'destructive',
      });
      setConnectionStatus('disconnected');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          إعدادات تلجرام
          {connectionStatus === 'connected' && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          {connectionStatus === 'disconnected' && (
            <XCircle className="h-4 w-4 text-destructive" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="botToken">Bot Token</Label>
          <Input
            id="botToken"
            type="password"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            placeholder="أدخل Bot Token"
            dir="ltr"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="chatId">Chat ID</Label>
          <Input
            id="chatId"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="أدخل Chat ID للقناة أو المجموعة"
            dir="ltr"
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="space-y-0.5">
            <Label>الإرسال التلقائي اليومي</Label>
            <p className="text-sm text-muted-foreground">
              إرسال رسالة عشوائية يومياً
            </p>
          </div>
          <Switch
            checked={autoSendEnabled}
            onCheckedChange={setAutoSendEnabled}
          />
        </div>

        {autoSendEnabled && (
          <div className="space-y-2">
            <Label htmlFor="autoSendTime">وقت الإرسال اليومي</Label>
            <Input
              id="autoSendTime"
              type="time"
              value={autoSendTime}
              onChange={(e) => setAutoSendTime(e.target.value)}
              dir="ltr"
            />
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} disabled={isSaving} className="flex-1">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'حفظ الإعدادات'
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={isTesting || !botToken || !chatId}
          >
            {isTesting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <TestTube className="ml-2 h-4 w-4" />
                اختبار
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
