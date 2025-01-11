import React, { useState } from 'react';
import { ArrowLeft, BookOpen, FileText, Users, Tags, Plus, Image, Link, List, ChevronDown } from 'lucide-react';

const Card = ({ children, className = '' }) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children }) => (
  <div className="flex flex-col space-y-1.5 p-6">{children}</div>
);

const CardTitle = ({ children }) => (
  <h3 className="text-lg font-semibold leading-none tracking-tight">{children}</h3>
);

const CardContent = ({ children }) => (
  <div className="p-6 pt-0">{children}</div>
);

const Button = ({ children, variant = 'default', className = '', ...props }) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background px-4 py-2";
  const variantStyles = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  };

  return (
    <button className={`${baseStyles} ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Label = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
    {children}
  </label>
);

const Input = ({ ...props }) => (
  <input
    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    {...props}
  />
);

const Textarea = ({ ...props }) => (
  <textarea
    className="flex min-h-[300px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    {...props}
  />
);

const Select = React.forwardRef(({ children, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
        ref={ref}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-3 h-4 w-4 opacity-50" />
    </div>
  );
});

Select.displayName = 'Select';

const Tabs = ({ children, defaultValue, onValueChange }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  const handleTabChange = (value) => {
    setActiveTab(value);
    if (onValueChange) {
      onValueChange(value);
    }
  };

  return (
    <div>
      {React.Children.map(children, (child) => {
        if (child.type === TabsList) {
          return React.cloneElement(child, { activeTab, onTabChange: handleTabChange });
        }
        if (child.type === TabsContent) {
          return React.cloneElement(child, { activeTab });
        }
        return child;
      })}
    </div>
  );
};

const TabsList = ({ children, activeTab, onTabChange }) => (
  <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
    {React.Children.map(children, (child) =>
      React.cloneElement(child, { isActive: child.props.value === activeTab, onSelect: onTabChange })
    )}
  </div>
);

const TabsTrigger = ({ children, value, isActive, onSelect }) => (
  <button
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
      isActive
        ? "bg-background text-foreground shadow-sm"
        : "hover:bg-muted hover:text-muted-foreground"
    }`}
    onClick={() => onSelect(value)}
  >
    {children}
  </button>
);

const TabsContent = ({ children, value, activeTab }) => (
  activeTab === value ? <div>{children}</div> : null
);

const CreateManual = () => {
  const [activeTab, setActiveTab] = useState('edit');

  return (
    <div className="p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" className="mb-4 p-0 hover:bg-transparent">
          <ArrowLeft className="h-5 w-5 mr-2" />
          ダッシュボードに戻る
        </Button>
        <h1 className="text-2xl font-bold text-foreground">マニュアル作成</h1>
        <p className="text-muted-foreground">業務マニュアルの新規作成と編集ができます</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                <BookOpen className="inline-block mr-2 h-5 w-5" />
                マニュアル編集
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">タイトル</Label>
                  <Input id="title" placeholder="マニュアルのタイトルを入力" />
                </div>

                <Tabs defaultValue="edit" onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="edit">編集</TabsTrigger>
                    <TabsTrigger value="preview">プレビュー</TabsTrigger>
                  </TabsList>
                  <TabsContent value="edit">
                    <div className="space-y-4">
                      {/* Editor Toolbar */}
                      <div className="flex items-center space-x-2 border-b pb-2">
                        <Button variant="outline" size="sm">
                          <List className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Image className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Link className="h-4 w-4" />
                        </Button>
                      </div>

                      <Textarea
                        placeholder="マニュアルの内容を入力してください"
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="preview">
                    <div className="border rounded-md p-4 min-h-[500px]">
                      プレビューがここに表示されます
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Sidebar */}
        <div className="space-y-6">
          {/* Category Card */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Tags className="inline-block mr-2 h-5 w-5" />
                カテゴリー設定
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="department">部門</Label>
                <Select id="department">
                  <option value="">部門を選択</option>
                  <option value="sales">営業部</option>
                  <option value="dev">開発部</option>
                  <option value="hr">人事部</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">カテゴリー</Label>
                <Select id="category">
                  <option value="">カテゴリーを選択</option>
                  <option value="procedure">業務手順</option>
                  <option value="rules">規則・規定</option>
                  <option value="system">システム操作</option>
                </Select>
              </div>

              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                新規カテゴリーを作成
              </Button>
            </CardContent>
          </Card>

          {/* Access Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Users className="inline-block mr-2 h-5 w-5" />
                アクセス設定
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="access-level">公開範囲</Label>
                <Select id="access-level">
                  <option value="">公開範囲を選択</option>
                  <option value="all">全社員</option>
                  <option value="department">部門内</option>
                  <option value="specific">指定メンバーのみ</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-permission">編集権限</Label>
                <Select id="edit-permission">
                  <option value="">編集権限を選択</option>
                  <option value="author">作成者のみ</option>
                  <option value="department">部門管理者</option>
                  <option value="specific">指定メンバー</option>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-2">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              マニュアルを公開
            </Button>
            <Button variant="outline">
              下書きとして保存
            </Button>
          </div>
        </div>
      </div>

      {/* Tips Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            <FileText className="inline-block mr-2 h-5 w-5" />
            効果的なマニュアル作成のヒント
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start">
              <span className="font-medium mr-2">・</span>
              目的と対象読者を明確にし、適切な詳細レベルで記述しましょう
            </li>
            <li className="flex items-start">
              <span className="font-medium mr-2">・</span>
              画像や図表を活用し、視覚的に分かりやすい説明を心がけましょう
            </li>
            <li className="flex items-start">
              <span className="font-medium mr-2">・</span>
              定期的な更新と見直しを行い、常に最新の情報を維持しましょう
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateManual;