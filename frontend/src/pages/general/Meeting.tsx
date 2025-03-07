import React from 'react';
import { ArrowLeft, Calendar, Users, Plus, FileText, Tag, Trash2 } from 'lucide-react';
import { format } from "date-fns";
import { ja } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Type definitions
type MeetingType = 'regular' | 'project' | 'adhoc';
type Department = 'sales' | 'dev' | 'hr' | 'all';

interface SelectOption {
  value: string;
  label: string;
}

const meetingTypes: SelectOption[] = [
  { value: 'regular', label: '定例会議' },
  { value: 'project', label: 'プロジェクトMTG' },
  { value: 'adhoc', label: '臨時会議' },
];

const departments: SelectOption[] = [
  { value: 'all', label: '全部門' },
  { value: 'sales', label: '営業部' },
  { value: 'dev', label: '開発部' },
  { value: 'hr', label: '人事部' },
];

interface AgendaItem {
  topic: string;
  duration: number;
}

interface MeetingFormData {
  title: string;
  type: MeetingType | '';
  department: Department | '';
  date: Date | undefined;
  startTime: string;
  duration: string;
  participants: string;
  agenda: AgendaItem[];
  description: string;
}

const CreateMeeting: React.FC = () => {
  const [formData, setFormData] = React.useState<MeetingFormData>({
    title: '',
    type: '',
    department: '',
    date: undefined,
    startTime: '',
    duration: '',
    participants: '',
    agenda: [{ topic: '', duration: 0 }],
    description: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: keyof MeetingFormData) => (value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAgendaChange = (index: number, field: keyof AgendaItem, value: string) => {
    const newAgenda = [...formData.agenda];
    newAgenda[index] = {
      ...newAgenda[index],
      [field]: field === 'duration' ? parseInt(value) || 0 : value,
    };
    setFormData((prev) => ({
      ...prev,
      agenda: newAgenda,
    }));
  };

  const addAgendaItem = () => {
    setFormData((prev) => ({
      ...prev,
      agenda: [...prev.agenda, { topic: '', duration: 0 }],
    }));
  };

  const removeAgendaItem = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      agenda: prev.agenda.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleSchedule = () => {
    console.log('Scheduling meeting:', formData);
  };

  return (
    <div className="p-6 bg-background min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" className="mb-4 p-0 hover:bg-transparent">
          <ArrowLeft className="h-5 w-5 mr-2" />
          ダッシュボードに戻る
        </Button>
        <h1 className="text-2xl font-bold text-foreground">会議スケジュール作成</h1>
        <p className="text-muted-foreground">新規会議のスケジュールを作成します</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Meeting Details Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                <Calendar className="inline-block mr-2 h-5 w-5" />
                会議詳細
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">会議タイトル</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="会議のタイトルを入力"
                    value={formData.title}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">開催日</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={`w-full justify-start text-left font-normal ${!formData.date && "text-muted-foreground"}`}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {formData.date ? format(formData.date, "yyyy年MM月dd日", { locale: ja }) : "日付を選択"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={formData.date}
                          onSelect={(date) => setFormData(prev => ({ ...prev, date }))}
                          disabled={(date) => date < new Date() || date > new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startTime">開始時刻</Label>
                    <Input
                      id="startTime"
                      name="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>アジェンダ</Label>
                  {formData.agenda.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <Input
                        placeholder="議題"
                        value={item.topic}
                        onChange={(e) => handleAgendaChange(index, 'topic', e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="時間（分）"
                        className="w-24"
                        value={item.duration || ''}
                        onChange={(e) => handleAgendaChange(index, 'duration', e.target.value)}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeAgendaItem(index)}
                        className="shrink-0"
                        disabled={formData.agenda.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addAgendaItem} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    アジェンダを追加
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">会議の概要</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="会議の目的や準備事項などを入力"
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Sidebar */}
        <div className="space-y-6">
          {/* Meeting Type Card */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Tag className="inline-block mr-2 h-5 w-5" />
                会議タイプ設定
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">会議タイプ</Label>
                <Select
                  value={formData.type}
                  onValueChange={handleSelectChange('type')}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="会議タイプを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {meetingTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">対象部門</Label>
                <Select
                  value={formData.department}
                  onValueChange={handleSelectChange('department')}
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder="部門を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.value} value={dept.value}>
                        {dept.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Participants Card */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Users className="inline-block mr-2 h-5 w-5" />
                参加者設定
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="participants">参加者</Label>
                <Textarea
                  id="participants"
                  name="participants"
                  placeholder="参加者の名前やメールアドレスを入力（改行区切り）"
                  value={formData.participants}
                  onChange={handleInputChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Button */}
          <Button onClick={handleSchedule} className="w-full">
            会議をスケジュール
          </Button>
        </div>
      </div>

      {/* Tips Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            <FileText className="inline-block mr-2 h-5 w-5" />
            効果的な会議運営のヒント
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start">
              <span className="font-medium mr-2">・</span>
              明確な目的とアジェンダを設定し、時間配分を意識しましょう
            </li>
            <li className="flex items-start">
              <span className="font-medium mr-2">・</span>
              参加者には事前に資料を共有し、準備時間を確保しましょう
            </li>
            <li className="flex items-start">
              <span className="font-medium mr-2">・</span>
              会議後は議事録を作成し、決定事項と次のアクションを明確にしましょう
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateMeeting;
