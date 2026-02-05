import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { HISTORICAL_CHARACTERS, VOICE_TYPES, DURATION_OPTIONS } from '@/lib/characters';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ContentGeneratorProps {
  onMessageSent: () => void;
}

export function ContentGenerator({ onMessageSent }: ContentGeneratorProps) {
  const [character, setCharacter] = useState('cleopatra');
  const [voiceType, setVoiceType] = useState('male_arabic');
  const [scenesCount, setScenesCount] = useState([6]);
  const [duration, setDuration] = useState('30');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-telegram', {
        body: {
          character,
          voiceType,
          scenesCount: scenesCount[0],
          duration: parseInt(duration),
        },
      });

      if (error) throw error;

      toast({
        title: 'تم الإرسال بنجاح! ✨',
        description: 'تم إرسال الرسالة إلى تلجرام',
      });
      onMessageSent();
    } catch (error: any) {
      toast({
        title: 'خطأ في الإرسال',
        description: error.message || 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCharacter = HISTORICAL_CHARACTERS.find(c => c.id === character);

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-primary" />
          مُنشئ المحتوى
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>الشخصية التاريخية</Label>
          <Select value={character} onValueChange={setCharacter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HISTORICAL_CHARACTERS.map((char) => (
                <SelectItem key={char.id} value={char.id}>
                  {char.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>نوع الصوت</Label>
          <Select value={voiceType} onValueChange={setVoiceType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VOICE_TYPES.map((voice) => (
                <SelectItem key={voice.id} value={voice.id}>
                  {voice.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>عدد المشاهد: {scenesCount[0]}</Label>
          <Slider
            value={scenesCount}
            onValueChange={setScenesCount}
            min={1}
            max={10}
            step={1}
          />
        </div>

        <div className="space-y-2">
          <Label>مدة الفيديو (ثانية)</Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((d) => (
                <SelectItem key={d} value={d.toString()}>
                  {d} ثانية
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Preview */}
        <div className="rounded-lg bg-muted/50 p-4 text-sm font-mono">
          <p className="text-muted-foreground mb-2">معاينة الرسالة:</p>
          <div className="space-y-1">
            <p>📌 عنوان: {selectedCharacter?.name}</p>
            <p>📝 وصف: {selectedCharacter?.name}</p>
            <p>🎙️ نوع_الصوت: {voiceType}</p>
            <p>🎬 عدد_المشاهد: {scenesCount[0]}</p>
            <p>⏱️ الطول: {duration}</p>
          </div>
        </div>

        <Button
          onClick={handleSend}
          disabled={isLoading}
          className="w-full h-12 text-lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="ml-2 h-5 w-5 animate-spin" />
              جاري الإرسال...
            </>
          ) : (
            <>
              <Send className="ml-2 h-5 w-5" />
              إنشاء وإرسال الآن
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
