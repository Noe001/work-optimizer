import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  preserveLineBreaks?: boolean;
}

export function MarkdownRenderer({ content, className, preserveLineBreaks = false }: MarkdownRendererProps) {
  const plugins = preserveLineBreaks 
    ? [remarkGfm, remarkBreaks]
    : [remarkGfm];

  return (
    <div className={cn('prose prose-sm dark:prose-invert max-w-none', className)}>
      <ReactMarkdown 
        rehypePlugins={[rehypeSanitize]} 
        remarkPlugins={plugins}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
} 
