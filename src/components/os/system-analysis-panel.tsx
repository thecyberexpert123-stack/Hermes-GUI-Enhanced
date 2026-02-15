import { type SystemPerformanceOutput } from '@/ai/flows/system-performance-analysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Bot, Loader, ShieldCheck } from 'lucide-react';

interface SystemAnalysisPanelProps {
  analysis: SystemPerformanceOutput | null;
  isAnalyzing: boolean;
}

const SystemAnalysisPanel = ({ analysis, isAnalyzing }: SystemAnalysisPanelProps) => {
  const Icon = analysis?.hasCriticalIssues ? AlertCircle : ShieldCheck;
  const iconColor = analysis?.hasCriticalIssues ? 'text-destructive' : 'text-green-400';
  const title = analysis?.hasCriticalIssues ? 'CRITICAL ALERTS' : 'SYSTEM STATUS: NOMINAL';

  return (
    <Card className="min-h-40 w-full max-w-2xl border-primary/20 bg-card/70 backdrop-blur-sm shadow-[0_0_20px_hsl(var(--primary)/0.15),inset_0_0_5px_hsl(var(--primary)/0.1)] xl:min-w-[600px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm tracking-widest text-primary/80">
          <Bot size={16} /> J.A.R.V.I.S. // AI ANALYSIS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAnalyzing && !analysis && (
          <div className="flex items-center gap-2 text-accent">
            <Loader className="animate-spin" size={16} />
            <span>ANALYZING METRICS...</span>
          </div>
        )}

        {analysis && (
          <>
            <div className={`flex items-start gap-3 rounded-md border-l-4 p-3 ${analysis.hasCriticalIssues ? 'border-destructive' : 'border-green-400'}`}>
              <Icon size={20} className={`${iconColor} mt-1 flex-shrink-0 [filter:drop-shadow(0_0_3px_currentColor)]`} />
              <div>
                <h3 className={`font-bold tracking-wider ${iconColor}`}>{title}</h3>
                <p className="text-sm text-foreground/80">{analysis.overallSummary}</p>
              </div>
            </div>

            {analysis.hasCriticalIssues && analysis.issues.length > 0 && (
              <div className="space-y-2">
                {analysis.issues.map((issue, index) => (
                  <div key={index} className="rounded-md bg-destructive/10 p-3 text-sm">
                    <p className="font-bold text-destructive/80">[{issue.category.toUpperCase()}]</p>
                    <p><span className="font-semibold">Description:</span> {issue.description}</p>
                    <p><span className="font-semibold">Recommendation:</span> {issue.recommendation}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemAnalysisPanel;
