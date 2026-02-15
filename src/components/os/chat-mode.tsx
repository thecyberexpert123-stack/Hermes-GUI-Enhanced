'use client';

import LoopingVoiceHUD from './looping-voice-hud';
import { type AppMode } from '@/app/page';
import { Grid, MessageSquare, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Corner = (props: React.HTMLAttributes<SVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M0 0 H 12 V 4 H 4 V 12 H 0 Z" />
  </svg>
);


const ChatMode = ({ setMode }: { setMode: (mode: AppMode) => void }) => {
    return (
        <div className="relative flex h-screen w-screen flex-col items-center justify-center gap-8 p-4 animate-fade-in font-headline">
            {/* Corner decorations */}
            <Corner className="absolute top-4 left-4 h-8 w-8 text-primary/50" />
            <Corner className="absolute top-4 right-4 h-8 w-8 -scale-x-100 text-primary/50" />
            <Corner className="absolute bottom-4 left-4 h-8 w-8 -scale-y-100 text-primary/50" />
            <Corner className="absolute bottom-4 right-4 h-8 w-8 scale-x-[-1] scale-y-[-1] text-primary/50" />

            {/* Top Header */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-4 text-primary tracking-widest text-sm">
                <button onClick={() => setMode('hud')} className="rounded-md p-1 transition-all hover:bg-primary/10 hover:text-accent hover:shadow-[0_0_15px_hsl(var(--primary)/0.3)]" title="Switch to HUD Mode">
                    <Grid size={16} />
                </button>
                <div className="flex items-center gap-2">
                    <MessageSquare size={16} />
                    <span>AI CHAT</span>
                </div>
            </div>

            <div className="flex-grow flex items-center justify-center">
              <LoopingVoiceHUD />
            </div>

            <div className="w-full max-w-2xl pb-8">
                <form className="relative w-full max-w-2xl">
                    <div className="relative rounded-full border border-primary/20 bg-background/30 backdrop-blur-sm shadow-[0_0_15px_hsl(var(--primary)/0.1)] transition-all focus-within:border-primary/50 focus-within:shadow-[0_0_20px_hsl(var(--primary)/0.2)]">
                        <Input
                            placeholder="Message J.A.R.V.I.S...."
                            className="h-12 w-full rounded-full border-none bg-transparent pr-14 text-base focus-visible:ring-0"
                        />
                        <Button type="submit" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full border border-primary/50 bg-transparent text-primary transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_15px_hsl(var(--primary))]">
                            <Send size={18} />
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatMode;
