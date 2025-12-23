import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: number;
  iconGradient?: string;
  testId?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  iconGradient = "from-primary/20 to-primary/5",
  testId,
}: StatCardProps) {
  return (
    <Card className="overflow-visible" data-testid={testId}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className="text-2xl font-bold mt-1 truncate" data-testid={`${testId}-value`}>
              {value}
            </p>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trend !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                {trend >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-status-online" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                )}
                <span
                  className={`text-xs font-medium ${
                    trend >= 0 ? "text-status-online" : "text-destructive"
                  }`}
                >
                  {trend >= 0 ? "+" : ""}
                  {trend.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          <div
            className={`p-3 rounded-md bg-gradient-to-br ${iconGradient} flex-shrink-0`}
          >
            <Icon className="h-5 w-5 text-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
