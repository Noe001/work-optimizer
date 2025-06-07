import MarkdownIt from 'markdown-it';

// Markdown-itのインスタンスを設定
const md = new MarkdownIt({
  html: true,        // HTMLタグを有効化
  linkify: true,     // URLを自動的にリンクに変換
  typographer: true, // 引用符やダッシュの美しい置換
  breaks: true,      // 改行を<br>に変換
});

/**
 * MarkdownテキストをHTMLに変換する
 */
export const renderMarkdown = (markdown: string): string => {
  if (!markdown) return '';
  
  try {
    return md.render(markdown);
  } catch (error) {
    console.error('Markdown rendering error:', error);
    return markdown; // エラーの場合は元のテキストを返す
  }
};

/**
 * Markdownテキストからプレーンテキストへの概要を生成
 */
export const getMarkdownPreview = (markdown: string, maxLength: number = 150): string => {
  if (!markdown) return '';
  
  try {
    // HTMLタグを除去してプレーンテキストに変換
    const html = md.render(markdown);
    const text = html.replace(/<[^>]*>/g, '');
    
    return text.length > maxLength 
      ? text.substring(0, maxLength) + '...'
      : text;
  } catch (error) {
    console.error('Markdown preview error:', error);
    return markdown.substring(0, maxLength) + '...';
  }
};

export default md; 
