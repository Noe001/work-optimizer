"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Header from "@/components/Header"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  Legend, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis
} from "recharts"
import { 
  Calendar as CalendarIcon, 
  Clock, 
  LogIn,
  LogOut,
  Edit,
  Check,
  X
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import attendanceService from "@/services/attendanceService"
import { formatTime } from "@/utils/dateUtils"
import { Input } from "@/components/ui/input"
import { isSameMonth } from "date-fns"

// 勤怠履歴テーブルの型定義
interface AttendanceRecord {
  id: number;
  date: string;
  checkIn: string;
  checkOut: string;
  totalHours: number;
  overtimeHours: number;
  status: string;
}

// サンプルデータ - 実際にはAPIから取得します
const dailyAttendanceData = [
  { date: "3/15", 勤務時間: 8.5, 残業時間: 0.5 },
  { date: "3/16", 勤務時間: 9.2, 残業時間: 1.2 },
  { date: "3/17", 勤務時間: 7.8, 残業時間: 0 },
  { date: "3/18", 勤務時間: 8.0, 残業時間: 0 },
  { date: "3/19", 勤務時間: 9.5, 残業時間: 1.5 },
  { date: "3/20", 勤務時間: 0, 残業時間: 0 },
  { date: "3/21", 勤務時間: 0, 残業時間: 0 },
]

const monthlyAttendanceData = [
  { month: "1月", 勤務時間: 168, 残業時間: 8 },
  { month: "2月", 勤務時間: 155, 残業時間: 5 },
  { month: "3月", 勤務時間: 175, 残業時間: 17 },
  { month: "4月", 勤務時間: 162, 残業時間: 2 },
  { month: "5月", 勤務時間: 161, 残業時間: 1 },
  { month: "6月", 勤務時間: 148, 残業時間: 0 },
]

// 勤怠履歴サンプルデータ
const attendanceHistory = [
  { 
    id: 1, 
    date: "2023-03-21", 
    checkIn: "08:55:23", 
    checkOut: "18:05:45", 
    totalHours: 8.17, 
    overtimeHours: 0.17, 
    status: "present" 
  },
  { 
    id: 2, 
    date: "2023-03-20", 
    checkIn: "09:10:05", 
    checkOut: "19:20:33", 
    totalHours: 9.17, 
    overtimeHours: 1.17, 
    status: "late" 
  },
  { 
    id: 3, 
    date: "2023-03-19", 
    checkIn: "08:48:12", 
    checkOut: "18:10:22", 
    totalHours: 8.37, 
    overtimeHours: 0.37, 
    status: "present" 
  },
  { 
    id: 4, 
    date: "2023-03-18", 
    checkIn: "08:52:37", 
    checkOut: "17:55:18", 
    totalHours: 7.97, 
    overtimeHours: 0, 
    status: "present" 
  },
  { 
    id: 5, 
    date: "2023-03-17", 
    checkIn: "-", 
    checkOut: "-", 
    totalHours: 0, 
    overtimeHours: 0, 
    status: "absent" 
  },
]

// 休暇リクエスト履歴
const leaveRequests = [
  { 
    id: 1, 
    type: "paid", 
    startDate: "2023-04-10", 
    endDate: "2023-04-12", 
    reason: "家族旅行", 
    status: "approved" 
  },
  { 
    id: 2, 
    type: "sick", 
    startDate: "2023-03-05", 
    endDate: "2023-03-06", 
    reason: "体調不良", 
    status: "approved" 
  },
  { 
    id: 3, 
    type: "other", 
    startDate: "2023-02-15", 
    endDate: "2023-02-15", 
    reason: "私用のため", 
    status: "rejected" 
  },
]

const AttendanceView: React.FC = () => {
  const [viewMode, setViewMode] = useState<"日次" | "週次" | "月次">("週次")
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)
  const [leaveType, setLeaveType] = useState<string>("")
  const [leaveStartDate, setLeaveStartDate] = useState<Date | undefined>(new Date())
  const [leaveEndDate, setLeaveEndDate] = useState<Date | undefined>(new Date())
  const [leaveReason, setLeaveReason] = useState<string>("")
  const [currentTime, setCurrentTime] = useState<string>(formatTime(new Date()))
  const [todayAttendance, setTodayAttendance] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(attendanceHistory)
  
  // 勤怠編集用の状態
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null)
  const [editCheckIn, setEditCheckIn] = useState("")
  const [editCheckOut, setEditCheckOut] = useState("")
  const [editStatus, setEditStatus] = useState("")
  
  // 現在時刻を1分ごとに更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(formatTime(new Date()));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // 本日の勤怠データを取得（実際のアプリケーションではAPI呼び出し）
  useEffect(() => {
    // ダミーデータ
    setTodayAttendance({
      date: format(new Date(), 'yyyy-MM-dd'),
      check_in: "09:05",
      check_out: null,
      status: "present"
    });
    
    // 実際のアプリケーションではAPI呼び出しでデータを取得
    // fetchAttendanceRecords();
  }, []);
  
  // 勤怠記録を取得（実際のアプリケーションでは使用）
  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      const response = await attendanceService.getAttendanceHistory('daily');
      if (response.success) {
        setAttendanceRecords(response.data);
      }
    } catch (error) {
      console.error("勤怠履歴取得エラー:", error);
      toast.error("勤怠履歴の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // 出勤打刻
  const handleCheckIn = async () => {
    try {
      setLoading(true);
      // 実際のアプリケーションではAPI呼び出し
      await attendanceService.checkIn();
      setTodayAttendance({
        ...todayAttendance,
        check_in: formatTime(new Date()),
        status: "present"
      });
      toast.success("出勤を記録しました");
    } catch (error) {
      console.error("出勤打刻エラー:", error);
      toast.error("出勤打刻に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // 退勤打刻
  const handleCheckOut = async () => {
    try {
      setLoading(true);
      // 実際のアプリケーションではAPI呼び出し
      await attendanceService.checkOut();
      setTodayAttendance({
        ...todayAttendance,
        check_out: formatTime(new Date())
      });
      toast.success("退勤を記録しました");
    } catch (error) {
      console.error("退勤打刻エラー:", error);
      toast.error("退勤打刻に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // 休暇申請
  const handleLeaveRequest = async () => {
    if (!leaveType || !leaveStartDate || !leaveEndDate || !leaveReason) {
      toast.error("すべての項目を入力してください");
      return;
    }

    try {
      setLoading(true);
      // 実際のアプリケーションではAPI呼び出し
      await attendanceService.requestLeave({
        type: leaveType as 'paid' | 'sick' | 'other',
        start_date: format(leaveStartDate, 'yyyy-MM-dd'),
        end_date: format(leaveEndDate, 'yyyy-MM-dd'),
        reason: leaveReason
      });
      
      setIsLeaveDialogOpen(false);
      toast.success("休暇申請を送信しました");
      
      // フォームをリセット
      setLeaveType("");
      setLeaveStartDate(new Date());
      setLeaveEndDate(new Date());
      setLeaveReason("");
    } catch (error) {
      console.error("休暇申請エラー:", error);
      toast.error("休暇申請に失敗しました");
    } finally {
      setLoading(false);
    }
  };
  
  // 勤怠記録の編集ダイアログを開く
  const openEditDialog = (record: AttendanceRecord) => {
    // 今月の勤怠のみ編集可能
    const recordDate = new Date(record.date);
    const currentDate = new Date();
    
    if (!isSameMonth(recordDate, currentDate)) {
      toast.error("今月の勤怠記録のみ編集できます");
      return;
    }
    
    setEditingRecord(record);
    setEditCheckIn(record.checkIn);
    setEditCheckOut(record.checkOut);
    setEditStatus(record.status);
    setIsEditDialogOpen(true);
  };
  
  // 本日の勤怠を編集
  const handleEditTodayAttendance = () => {
    if (!todayAttendance) return;
    
    // 本日の勤怠データを編集用に変換
    const todayRecord: AttendanceRecord = {
      id: 0, // 一時的なID
      date: todayAttendance.date,
      checkIn: todayAttendance.check_in || "",
      checkOut: todayAttendance.check_out || "",
      totalHours: 0, // 仮の値
      overtimeHours: 0, // 仮の値
      status: todayAttendance.status
    };
    
    setEditingRecord(todayRecord);
    setEditCheckIn(todayRecord.checkIn);
    setEditCheckOut(todayRecord.checkOut);
    setEditStatus(todayRecord.status);
    setIsEditDialogOpen(true);
  };
  
  // 勤怠記録の更新
  const handleUpdateAttendance = async () => {
    if (!editingRecord) return;
    
    try {
      setLoading(true);
      
      // 本日の勤怠編集の場合
      if (editingRecord.id === 0) {
        // 本日の勤怠データを更新
        setTodayAttendance({
          ...todayAttendance,
          check_in: editCheckIn,
          check_out: editCheckOut,
          status: editStatus
        });
        
        // 実際のアプリケーションではAPI呼び出し
        // await attendanceService.updateTodayAttendance({
        //   check_in: editCheckIn,
        //   check_out: editCheckOut,
        //   status: editStatus
        // });
        
        setIsEditDialogOpen(false);
        toast.success("本日の勤怠記録を更新しました");
        return;
      }
      
      // 過去の勤怠記録更新の場合
      // 実際のアプリケーションではAPI呼び出し
      // 今回はフロントエンドのみで更新
      const updatedRecords = attendanceRecords.map(record => {
        if (record.id === editingRecord.id) {
          // 簡易的な時間計算（実際のアプリケーションではより精密な計算が必要）
          const checkInTime = new Date(`2000-01-01T${editCheckIn}`);
          const checkOutTime = new Date(`2000-01-01T${editCheckOut}`);
          const diffInHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
          const totalHours = Math.round(diffInHours * 100) / 100;
          const overtimeHours = Math.max(0, Math.round((totalHours - 8) * 100) / 100);
          
          return {
            ...record,
            checkIn: editCheckIn,
            checkOut: editCheckOut,
            status: editStatus,
            totalHours,
            overtimeHours
          };
        }
        return record;
      });
      
      setAttendanceRecords(updatedRecords);
      setIsEditDialogOpen(false);
      toast.success("勤怠記録を更新しました");
    } catch (error) {
      console.error("勤怠更新エラー:", error);
      toast.error("勤怠記録の更新に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'present':
        return <Badge className="bg-green-500">出勤</Badge>;
      case 'late':
        return <Badge className="bg-amber-500">遅刻</Badge>;
      case 'absent':
        return <Badge className="bg-red-500">欠勤</Badge>;
      case 'holiday':
        return <Badge className="bg-blue-500">休日</Badge>;
      default:
        return <Badge>不明</Badge>;
    }
  };

  const getLeaveStatusBadge = (status: string) => {
    switch(status) {
      case 'approved':
        return <Badge className="bg-green-500">承認済</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">却下</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500">審査中</Badge>;
      default:
        return <Badge>不明</Badge>;
    }
  };

  const getLeaveTypeBadge = (type: string) => {
    switch(type) {
      case 'paid':
        return <Badge className="bg-blue-500">有給休暇</Badge>;
      case 'sick':
        return <Badge className="bg-purple-500">病気休暇</Badge>;
      case 'other':
        return <Badge className="bg-gray-500">その他</Badge>;
      default:
        return <Badge>不明</Badge>;
    }
  };

  // 勤怠記録が編集可能かどうか判定
  const isEditableRecord = (date: string): boolean => {
    const recordDate = new Date(date);
    const currentDate = new Date();
    return isSameMonth(recordDate, currentDate);
  };

  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="container mx-auto py-4">
        <h1 className="text-2xl font-bold">勤怠管理</h1>
      </div>
      <div className="flex-1 container mx-auto py-6 space-y-6">
        {/* 現在時刻と打刻ボタン */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">勤怠打刻</CardTitle>
              <CardDescription>本日の勤怠状況と打刻</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">本日の日付</div>
                  <div className="text-2xl font-semibold">{format(new Date(), 'yyyy年MM月dd日')}</div>
                  <div className="flex items-center justify-center mt-1">
                    <Clock className="h-4 w-4 mr-1" />
                    <span className="text-xl">{currentTime}</span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-sm text-muted-foreground">出勤時刻</div>
                      <div className="font-medium">
                        {todayAttendance?.check_in || '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">退勤時刻</div>
                      <div className="font-medium">
                        {todayAttendance?.check_out || '-'}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2">
                    {getStatusBadge(todayAttendance?.status || 'unknown')}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    className="flex gap-2 bg-green-600 hover:bg-green-700"
                    onClick={handleCheckIn}
                    disabled={loading || !!todayAttendance?.check_in}
                  >
                    <LogIn className="h-4 w-4" />
                    出勤
                  </Button>
                  <Button
                    className="flex gap-2 bg-blue-600 hover:bg-blue-700"
                    onClick={handleCheckOut}
                    disabled={loading || !todayAttendance?.check_in || !!todayAttendance?.check_out}
                  >
                    <LogOut className="h-4 w-4" />
                    退勤
                  </Button>
                  <Button
                    className="flex gap-2"
                    variant="outline"
                    onClick={handleEditTodayAttendance}
                  >
                    <Edit className="h-4 w-4" />
                    編集
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">休暇申請</CardTitle>
              <CardDescription>休暇の申請</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center justify-between w-full">
                  <div>
                    <div className="text-sm text-muted-foreground">有給休暇残日数</div>
                    <div className="font-semibold">15日</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">病気休暇残日数</div>
                    <div className="font-semibold">5日</div>
                  </div>
                </div>
                <Button className="w-full" onClick={() => setIsLeaveDialogOpen(true)}>
                  休暇を申請する
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 勤怠データのグラフ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">勤怠分析</CardTitle>
            <div className="flex items-center gap-2">
              <CardDescription>勤務時間の推移</CardDescription>
              <div className="ml-auto">
                <Tabs defaultValue={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                  <TabsList>
                    <TabsTrigger value="日次">日次</TabsTrigger>
                    <TabsTrigger value="週次">週次</TabsTrigger>
                    <TabsTrigger value="月次">月次</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={viewMode === "月次" ? monthlyAttendanceData : dailyAttendanceData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="勤務時間" stackId="a" fill="#3B82F6" />
                <Bar dataKey="残業時間" stackId="a" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 勤怠履歴テーブル */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">勤怠履歴</CardTitle>
            <CardDescription>過去の勤怠記録（今月の記録は編集可能）</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日付</TableHead>
                  <TableHead>出勤時刻</TableHead>
                  <TableHead>退勤時刻</TableHead>
                  <TableHead>勤務時間</TableHead>
                  <TableHead>残業時間</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead>編集</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>{record.checkIn}</TableCell>
                    <TableCell>{record.checkOut}</TableCell>
                    <TableCell>{record.totalHours}時間</TableCell>
                    <TableCell>{record.overtimeHours}時間</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openEditDialog(record)}
                        disabled={!isEditableRecord(record.date)}
                        className={!isEditableRecord(record.date) ? "opacity-50 cursor-not-allowed" : ""}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 休暇リクエスト履歴 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">休暇申請履歴</CardTitle>
            <CardDescription>過去の休暇申請</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>種類</TableHead>
                  <TableHead>開始日</TableHead>
                  <TableHead>終了日</TableHead>
                  <TableHead>理由</TableHead>
                  <TableHead>状態</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{getLeaveTypeBadge(request.type)}</TableCell>
                    <TableCell>{request.startDate}</TableCell>
                    <TableCell>{request.endDate}</TableCell>
                    <TableCell>{request.reason}</TableCell>
                    <TableCell>{getLeaveStatusBadge(request.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* 休暇申請ダイアログ */}
      <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>休暇申請</DialogTitle>
            <DialogDescription>
              休暇の種類、期間、理由を入力してください。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="leaveType" className="text-right">
                種類
              </Label>
              <Select
                value={leaveType}
                onValueChange={setLeaveType}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="休暇の種類を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">有給休暇</SelectItem>
                  <SelectItem value="sick">病気休暇</SelectItem>
                  <SelectItem value="other">その他</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="leaveStartDate" className="text-right">
                開始日
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {leaveStartDate ? (
                        format(leaveStartDate, "yyyy年MM月dd日")
                      ) : (
                        <span>日付を選択</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={leaveStartDate}
                      onSelect={setLeaveStartDate}
                      initialFocus
                      locale={ja}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="leaveEndDate" className="text-right">
                終了日
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {leaveEndDate ? (
                        format(leaveEndDate, "yyyy年MM月dd日")
                      ) : (
                        <span>日付を選択</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={leaveEndDate}
                      onSelect={setLeaveEndDate}
                      initialFocus
                      locale={ja}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="leaveReason" className="text-right">
                理由
              </Label>
              <Textarea
                id="leaveReason"
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                placeholder="休暇の理由を入力してください"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleLeaveRequest}
              disabled={loading}
            >
              申請する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 勤怠編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>勤怠記録の編集</DialogTitle>
            <DialogDescription>
              {editingRecord?.date}の勤怠記録を編集します
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editCheckIn" className="text-right">
                出勤時刻
              </Label>
              <Input
                id="editCheckIn"
                type="time"
                value={editCheckIn}
                onChange={(e) => setEditCheckIn(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editCheckOut" className="text-right">
                退勤時刻
              </Label>
              <Input
                id="editCheckOut"
                type="time"
                value={editCheckOut}
                onChange={(e) => setEditCheckOut(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editStatus" className="text-right">
                状態
              </Label>
              <Select
                value={editStatus}
                onValueChange={setEditStatus}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="状態を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">出勤</SelectItem>
                  <SelectItem value="late">遅刻</SelectItem>
                  <SelectItem value="absent">欠勤</SelectItem>
                  <SelectItem value="holiday">休日</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              キャンセル
            </Button>
            <Button
              onClick={handleUpdateAttendance}
              disabled={loading}
            >
              <Check className="h-4 w-4 mr-2" />
              更新する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AttendanceView 
