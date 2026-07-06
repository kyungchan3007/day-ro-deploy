import { cn } from "../lib";
import { Button } from "../button";
import { DownloadIcon, RefreshIcon } from "../icon";

export interface CourseActionsProps {
  onSave?: () => void;
  onReroll?: () => void;
  saveLabel?: string;
  rerollLabel?: string;
  className?: string;
}

/**
 * btn-course-group : 코스 저장 / 다른 코스 보기 액션 묶음.
 * 내부적으로 Button(variant="secondary") 조합.
 */
export function CourseActions({
  onSave,
  onReroll,
  saveLabel = "코스저장",
  rerollLabel = "다른코스보기",
  className,
}: CourseActionsProps) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <Button
        variant="secondary"
        size="sm"
        onClick={onSave}
        leftIcon={<DownloadIcon size={15} />}
      >
        {saveLabel}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={onReroll}
        leftIcon={<RefreshIcon size={15} />}
      >
        {rerollLabel}
      </Button>
    </div>
  );
}
