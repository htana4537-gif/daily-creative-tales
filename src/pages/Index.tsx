import { useState } from 'react';
import { ContentGenerator } from '@/components/ContentGenerator';
import { TelegramSettings } from '@/components/TelegramSettings';
import { MessagesHistory } from '@/components/MessagesHistory';
import { DashboardStats } from '@/components/DashboardStats';
import { Send } from 'lucide-react';

const Index = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleMessageSent = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="rounded-xl bg-primary p-3">
              <Send className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold md:text-4xl">
              مُنشئ المحتوى اليومي
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            إنشاء وإرسال محتوى إبداعي عن الشخصيات التاريخية إلى تلجرام
          </p>
        </header>

        {/* Stats */}
        <div className="mb-8">
          <DashboardStats refreshTrigger={refreshTrigger} />
        </div>

        {/* Main Grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-8">
            <ContentGenerator onMessageSent={handleMessageSent} />
            <TelegramSettings />
          </div>
          <div>
            <MessagesHistory refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
