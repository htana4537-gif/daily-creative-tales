import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Settings, TestTube, Loader2, CheckCircle, XCircle, ExternalLink, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CONTENT_CATEGORIES, VOICE_TYPES, DURATION_OPTIONS } from '@/lib/characters';

export function TelegramSettings() {
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [sessionString, setSessionString] = useState('');
  const [chatId, setChatId] = useState('');
  const [autoSendEnabled, setAutoSendEnabled] = useState(false);
  const [autoSendTime, setAutoSendTime] = useState('09:00');
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);
  const [preferredVoice, setPreferredVoice] = useState('');
  const [preferredScenesMin, setPreferredScenesMin] = useState(5);
  const [preferredScenesMax, setPreferredScenesMax] = useState(25);
  const [preferredDuration, setPreferredDuration] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | null>(null);
  const [hasCredentials, setHasCredentials] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-settings', {
        body: { action: 'load' },
      });

      if (error) throw error;

      if (data?.settings) {
        const s = data.settings;
        setChatId(s.chat_id || '');
        setAutoSendEnabled(s.auto_send_enabled);
        setAutoSendTime(s.auto_send_time?.slice(0, 5) || '09:00');
        setHasCredentials(s.has_api_id && s.has_api_hash && s.has_session_string);
        setPreferredCategories(s.preferred_categories || []);
        setPreferredVoice(s.preferred_voice || '');
        setPreferredScenesMin(s.preferred_scenes_min ?? 5);
        setPreferredScenesMax(s.preferred_scenes_max ?? 25);
        setPreferredDuration(s.preferred_duration ? String(s.preferred_duration) : '');
        if (s.has_session_string) {
          setConnectionStatus('connected');
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const toggleCategory = (catId: string) => {
    setPreferredCategories(prev =>
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-settings', {
        body: {
          action: 'save',
          settings: {
            api_id: apiId,
            api_hash: apiHash,
            session_string: sessionString,
            chat_id: chatId,
            auto_send_enabled: autoSendEnabled,
            auto_send_time: autoSendTime + ':00',
            preferred_categories: preferredCategories,
            preferred_voice: preferredVoice,
            preferred_scenes_min: preferredScenesMin,
            preferred_scenes_max: preferredScenesMax,
            preferred_duration: preferredDuration ? parseInt(preferredDuration) : null,
          },
        },
      });

      if (error) throw error;

      toast({
        title: 'تم الحفظ ✓',
        description: 'تم حفظ إعدادات تلجرام بنجاح',
      });
      setConnectionStatus('connected');
      setHasCredentials(true);
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
      const { data, error } = await supabase.functions.invoke('test-telegram');

      if (error) throw error;
      if (data && !data.success) throw new Error(data.error || 'فشل الاختبار');

      toast({
        title: 'نجح الاختبار! ✓',
        description: 'تم إرسال رسالة اختبار من حسابك الشخصي',
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

  const handleTriggerAutoSend = async () => {
    setIsTriggering(true);
    try {
      const { data, error } = await supabase.functions.invoke('daily-send');

      if (error) throw error;
      if (data && !data.success) throw new Error(data.message || data.error || 'فشل الإرسال');

      toast({
        title: 'تم الإرسال التلقائي! ✨',
        description: `تم إرسال: ${data.character || ''}`,
      });
    } catch (error: any) {
      toast({
        title: 'فشل الإرسال التلقائي',
        description: error.message || 'حدث خطأ',
        variant: 'destructive',
      });
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          إعدادات تلجرام (User API)
          {connectionStatus === 'connected' && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
          {connectionStatus === 'disconnected' && (
            <XCircle className="h-4 w-4 text-destructive" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
          <p className="font-medium mb-1">📌 كيفية الحصول على البيانات:</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>
              احصل على API ID و API Hash من{' '}
              <a href="https://my.telegram.org" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-0.5">
                my.telegram.org <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>
              شغّل <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">deno -A jsr:@mtkruto/auth-string</code> لتوليد Session String
            </li>
          </ol>
        </div>

        {hasCredentials && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
            ✅ تم حفظ بيانات الاتصال. أدخل قيماً جديدة فقط إذا أردت تحديثها.
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="apiId">API ID</Label>
          <Input
            id="apiId"
            value={apiId}
            onChange={(e) => setApiId(e.target.value)}
            placeholder={hasCredentials ? '••••••• (محفوظ)' : 'مثال: 12345678'}
            dir="ltr"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="apiHash">API Hash</Label>
          <Input
            id="apiHash"
            type="password"
            value={apiHash}
            onChange={(e) => setApiHash(e.target.value)}
            placeholder={hasCredentials ? '••••••• (محفوظ)' : 'أدخل API Hash'}
            dir="ltr"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sessionString">Session String</Label>
          <Textarea
            id="sessionString"
            value={sessionString}
            onChange={(e) => setSessionString(e.target.value)}
            placeholder={hasCredentials ? '••••••• (محفوظ)' : 'الصق Session String هنا'}
            dir="ltr"
            rows={3}
            className="font-mono text-xs"
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
              إرسال رسالة عشوائية يومياً من حسابك
            </p>
          </div>
          <Switch
            checked={autoSendEnabled}
            onCheckedChange={setAutoSendEnabled}
          />
        </div>

        {autoSendEnabled && (
          <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
            <p className="text-sm font-medium text-muted-foreground">⚙️ تفضيلات الإرسال التلقائي</p>

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

            <div className="space-y-2">
              <Label>الفئات المفضلة (اترك فارغاً للاختيار العشوائي)</Label>
              <div className="grid grid-cols-3 gap-2">
                {CONTENT_CATEGORIES.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={preferredCategories.includes(cat.id) ? 'default' : 'outline'}
                    size="sm"
                    className="flex items-center gap-1 h-auto py-2 text-xs"
                    onClick={() => toggleCategory(cat.id)}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>نوع الصوت المفضل</Label>
              <Select value={preferredVoice} onValueChange={setPreferredVoice}>
                <SelectTrigger>
                  <SelectValue placeholder="عشوائي" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="random">عشوائي</SelectItem>
                  {VOICE_TYPES.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>عدد المشاهد: {preferredScenesMin} - {preferredScenesMax}</Label>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">الحد الأدنى</span>
                <Slider
                  value={[preferredScenesMin]}
                  onValueChange={([v]) => setPreferredScenesMin(Math.min(v, preferredScenesMax))}
                  min={1}
                  max={25}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm font-mono w-6 text-center">{preferredScenesMin}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">الحد الأقصى</span>
                <Slider
                  value={[preferredScenesMax]}
                  onValueChange={([v]) => setPreferredScenesMax(Math.max(v, preferredScenesMin))}
                  min={1}
                  max={25}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm font-mono w-6 text-center">{preferredScenesMax}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>مدة الفيديو المفضلة</Label>
              <Select value={preferredDuration} onValueChange={setPreferredDuration}>
                <SelectTrigger>
                  <SelectValue placeholder="عشوائي" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="random">عشوائي</SelectItem>
                  {DURATION_OPTIONS.map((d) => (
                    <SelectItem key={d} value={d.toString()}>
                      {d} ثانية
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2 flex-wrap">
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
            disabled={isTesting || (!hasCredentials && (!apiId || !apiHash || !sessionString || !chatId))}
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
          <Button
            variant="secondary"
            onClick={handleTriggerAutoSend}
            disabled={isTriggering || !hasCredentials}
          >
            {isTriggering ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Zap className="ml-2 h-4 w-4" />
                تشغيل الإرسال التلقائي الآن
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
