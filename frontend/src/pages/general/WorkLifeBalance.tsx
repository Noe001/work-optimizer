"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import Header from "@/components/Header"

const WorkLifeBalance: React.FC = () => {
  const [endOfDaySummary, setEndOfDaySummary] = useState("")
  const [workCompleted, setWorkCompleted] = useState("")
  const [challengesFaced, setChallengesFaced] = useState("")
  const [improvements, setImprovements] = useState("")
  const [history, setHistory] = useState<Array<{ date: string, summary: string }>>([])

  const handleSubmit = () => {
    const newEntry = {
      date: new Date().toLocaleDateString(),
      summary: endOfDaySummary,
    }
    setHistory([...history, newEntry])
    console.log("業務終了通知:", {
      endOfDaySummary,
      workCompleted,
      challengesFaced,
      improvements,
    })
    // ここでAPIを呼び出してデータを保存する
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">業務終了通知と振り返り</h1>
          <p className="text-muted-foreground">業務終了時に通知を受け取り、1日の振り返りを行います。</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>振り返りツール</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              <div className="space-y-2">
                <label htmlFor="endOfDaySummary" className="block text-sm font-medium">
                  業務終了時のまとめ
                </label>
                <Textarea
                  id="endOfDaySummary"
                  value={endOfDaySummary}
                  onChange={(e) => setEndOfDaySummary(e.target.value)}
                  placeholder="今日の業務をまとめてください"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="workCompleted" className="block text-sm font-medium">
                  完了した業務
                </label>
                <Textarea
                  id="workCompleted"
                  value={workCompleted}
                  onChange={(e) => setWorkCompleted(e.target.value)}
                  placeholder="今日完了した業務を記入"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="challengesFaced" className="block text-sm font-medium">
                  直面した課題
                </label>
                <Textarea
                  id="challengesFaced"
                  value={challengesFaced}
                  onChange={(e) => setChallengesFaced(e.target.value)}
                  placeholder="今日直面した課題を記入"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="improvements" className="block text-sm font-medium">
                  改善点
                </label>
                <Textarea
                  id="improvements"
                  value={improvements}
                  onChange={(e) => setImprovements(e.target.value)}
                  placeholder="明日以降の改善点を記入"
                  rows={4}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit">保存</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6">
          <h2 className="text-xl font-bold text-foreground">振り返り履歴</h2>
          <div className="space-y-4 mt-4">
            {history.map((entry, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{entry.date}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{entry.summary}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkLifeBalance
