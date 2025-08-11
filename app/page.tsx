"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Trophy, Target, Clock, BookOpen, ExternalLink, Play } from "lucide-react";
import Link from "next/link";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface QuizResult {
  id: number;
  score: number;
  total_questions: number;
  created_at: string;
}

// 科と目のデータ型
interface FamilyData {
  families: string[];
  count: number;
}

interface OrderData {
  orders: string[];
  count: number;
}

interface TabsProps {
  children: React.ReactNode;
  defaultValue: string;
  className?: string;
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

// Simple Tabs implementation
function Tabs({ children, defaultValue, className = "" }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  return (
    <div className={`w-full ${className}`} data-active-tab={activeTab}>
      <TabsProvider value={{ activeTab, setActiveTab }}>
        {children}
      </TabsProvider>
    </div>
  );
}

function TabsList({ children, className = "" }: TabsListProps) {
  return (
    <div className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className}`}>
      {children}
    </div>
  );
}

function TabsTrigger({ value, children, className = "" }: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  
  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        activeTab === value 
          ? 'bg-background text-foreground shadow-sm' 
          : 'hover:bg-background/80 hover:text-foreground'
      } ${className}`}
    >
      {children}
    </button>
  );
}

function TabsContent({ value, children, className = "" }: TabsContentProps) {
  const { activeTab } = useTabsContext();
  
  if (activeTab !== value) return null;
  
  return (
    <div className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}>
      {children}
    </div>
  );
}

// Context for tabs
const TabsContext = React.createContext<{
  activeTab: string;
  setActiveTab: (tab: string) => void;
} | null>(null);

function TabsProvider({ children, value }: { children: React.ReactNode; value: { activeTab: string; setActiveTab: (tab: string) => void } }) {
  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>;
}

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('useTabsContext must be used within a TabsProvider');
  }
  return context;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [recentResults, setRecentResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [families, setFamilies] = useState<string[]>([]);
  const [orders, setOrders] = useState<string[]>([]);
  const [loadingFamilies, setLoadingFamilies] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        await loadUserData(user.id);
      }
      setLoading(false);
    }

    // 科と目のデータを取得する関数
    async function loadFamiliesAndOrders() {
      // 科データを取得
      setLoadingFamilies(true);
      try {
        const familyResponse = await fetch('/api/birds/families');
        if (familyResponse.ok) {
          const familyData: FamilyData = await familyResponse.json();
          setFamilies(familyData.families || []);
        }
      } catch (error) {
        console.error('科データの取得に失敗しました:', error);
      }
      setLoadingFamilies(false);

      // 目データを取得
      setLoadingOrders(true);
      try {
        const orderResponse = await fetch('/api/birds/orders');
        if (orderResponse.ok) {
          const orderData: OrderData = await orderResponse.json();
          setOrders(orderData.orders || []);
        }
      } catch (error) {
        console.error('目データの取得に失敗しました:', error);
      }
      setLoadingOrders(false);
    }

    getUser();
    loadFamiliesAndOrders();
  }, []);

  async function loadUserData(userId: string) {
    try {
      const { data: results } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      if (results) {
        setRecentResults(results);
      }
    } catch (error) {
      console.error('データの読み込みに失敗しました:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="読み込み中..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{backgroundColor: '#F0F1F1'}}>
      <Header />
      
      <main role="main" className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* タイトル */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl mb-6 shadow-lg">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-clip-text text-transparent mb-4">
              野鳥識別士道場
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-primary/60 mx-auto mt-4 rounded-full"></div>
          </div>

          {/* 3カラムレイアウト */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* 左カラム: 個人の情報 */}
            <div className="lg:col-span-3">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 p-8 hover:shadow-2xl transition-all duration-300">
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-md">
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                  あなたの成績
                </h2>
                
                {user ? (
                  <div className="space-y-4">
                    {/* 統計カード */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-primary/20 rounded-xl border border-primary/30 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary rounded-lg shadow-md">
                            <Target className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-slate-700">正解率</span>
                        </div>
                        <span className="font-bold text-primary text-lg">85%</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-primary/20 rounded-xl border border-primary/30 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/80 rounded-lg shadow-md">
                            <Trophy className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-slate-700">挑戦回数</span>
                        </div>
                        <span className="font-bold text-primary text-lg">12回</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-primary/20 rounded-xl border border-primary/30 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/90 rounded-lg shadow-md">
                            <Clock className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-slate-700">学習時間</span>
                        </div>
                        <span className="font-bold text-primary text-lg">3時間</span>
                      </div>
                    </div>

                    {/* 最近の結果 */}
                    {recentResults.length > 0 && (
                      <div className="mt-8">
                        <h3 className="text-base font-semibold text-slate-700 mb-4">最近の成績</h3>
                        <div className="space-y-3">
                          {recentResults.map((result) => {
                            const percentage = Math.round((result.score / result.total_questions) * 100);
                            return (
                              <div key={result.id} className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl border border-slate-200/50 shadow-sm">
                                <span className="text-slate-600 font-medium text-sm">
                                  {new Date(result.created_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                                </span>
                                <span className="font-bold text-slate-800">
                                  {percentage}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-3">
                      <Trophy className="h-12 w-12 mx-auto mb-3" />
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      ログインすると<br />
                      あなたの学習状況が<br />
                      ここに表示されます
                    </p>
                    <Link href="/auth/login">
                      <Button size="sm" className="w-full">
                        ログインして開始
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* 中央カラム: メインコンテンツ */}
            <div className="lg:col-span-6">
              <div className="space-y-8">
                {/* LPヒーロー画像（添付画像を表示） */}
                {/* 中央の画像は不要のため削除 */}
                {/* 野鳥識別士試験とは？ */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 p-8 hover:shadow-2xl transition-all duration-300">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-md">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    野鳥識別士試験とは？
                  </h2>
                  <div className="text-slate-600 space-y-4 leading-relaxed">
                    <p className="text-base">
                      野鳥識別士試験は、日本野鳥の会が主催する野鳥の知識と識別能力を測る検定試験です。
                      自然保護や野鳥観察の普及を目的として実施されています。
                    </p>
                    <p className="text-base">
                      試験では野鳥の形態、生態、分布、保護などについて幅広く問われ、
                      4級から1級まで段階的に難易度が設定されています。
                    </p>
                  </div>
                </div>

                {/* 問題演習セクション */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 p-8 hover:shadow-2xl transition-all duration-300">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-md">
                      <Play className="h-6 w-6 text-white" />
                    </div>
                    問題を解いてみよう
                  </h2>
                  
                  <Tabs defaultValue="mock" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-slate-100/80 p-1.5 rounded-xl shadow-inner">
                      <TabsTrigger value="mock" className="data-[state=active]:bg-white data-[state=active]:shadow-md font-semibold">模擬試験</TabsTrigger>
                      <TabsTrigger value="family" className="data-[state=active]:bg-white data-[state=active]:shadow-md font-semibold">科ごと</TabsTrigger>
                      <TabsTrigger value="order" className="data-[state=active]:bg-white data-[state=active]:shadow-md font-semibold">目ごと</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="mock" className="space-y-6 mt-6">
                      <p className="text-slate-600 text-base leading-relaxed">
                        本試験と同じ形式で実際の試験対策ができます。
                        時間制限ありで本格的な練習をしましょう。
                      </p>
                      <div className="space-y-3">
                        <Link href="/quiz?mode=mock&level=4">
                          <Button className="w-full justify-start h-14 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white shadow-lg hover:shadow-xl transition-all duration-300" variant="default">
                            4級模擬試験（基礎レベル）
                          </Button>
                        </Link>
                        <Link href="/quiz?mode=mock&level=3">
                          <Button className="w-full justify-start h-14 text-base font-semibold bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300" variant="default">
                            3級模擬試験（中級レベル）
                          </Button>
                        </Link>
                        <Link href="/quiz?mode=mock&level=2">
                          <Button className="w-full justify-start h-14 text-base font-semibold bg-gradient-to-r from-primary/80 to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-lg hover:shadow-xl transition-all duration-300" variant="default">
                            2級模擬試験（上級レベル）
                          </Button>
                        </Link>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="family" className="space-y-6 mt-6">
                      <p className="text-slate-600 text-base leading-relaxed">
                        科（Family）ごとに問題を絞って練習できます。
                        苦手な分野を集中的に学習しましょう。
                      </p>
                      <div className="h-64 overflow-y-auto border border-slate-200/50 rounded-xl p-4 bg-slate-50/30 shadow-inner">
                        {loadingFamilies ? (
                          <div className="flex items-center justify-center py-4">
                            <LoadingSpinner size="sm" text="読み込み中..." />
                          </div>
                        ) : families.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {families.map((family) => (
                              <Link key={family} href={`/quiz?mode=family&family=${encodeURIComponent(family)}`}>
                                <Card className="hover:shadow-lg hover:scale-105 transition-all duration-300 h-full bg-white/80 backdrop-blur-sm border border-slate-200/50">
                                  <CardContent className="p-4 text-center">
                                    <span className="text-sm font-semibold text-slate-800">{family}</span>
                                  </CardContent>
                                </Card>
                              </Link>
                            ))}
                            {/* 全ての科 */}
                            <Link href="/quiz?mode=family&family=all">
                              <Card className="hover:shadow-lg hover:scale-105 transition-all duration-300 h-full bg-gradient-to-br from-primary to-primary/80 border border-primary/30">
                                <CardContent className="p-4 text-center">
                                  <span className="text-sm font-semibold text-white">全て</span>
                                </CardContent>
                              </Card>
                            </Link>
                          </div>
                        ) : (
                          <p className="text-gray-500 text-center py-4">科データが見つかりませんでした</p>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="order" className="space-y-6 mt-6">
                      <p className="text-slate-600 text-base leading-relaxed">
                        目（Order）ごとに問題を分類して練習できます。
                        分類学の理解を深めながら学習しましょう。
                      </p>
                      <div className="h-64 overflow-y-auto border border-slate-200/50 rounded-xl p-4 bg-slate-50/30 shadow-inner">
                        {loadingOrders ? (
                          <div className="flex items-center justify-center py-4">
                            <LoadingSpinner size="sm" text="読み込み中..." />
                          </div>
                        ) : orders.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {orders.map((order) => (
                              <Link key={order} href={`/quiz?mode=order&order=${encodeURIComponent(order)}`}>
                                <Card className="hover:shadow-lg hover:scale-105 transition-all duration-300 h-full bg-white/80 backdrop-blur-sm border border-slate-200/50">
                                  <CardContent className="p-4 text-center">
                                    <span className="text-sm font-semibold text-slate-800">{order}</span>
                                  </CardContent>
                                </Card>
                              </Link>
                            ))}
                            {/* 全ての目 */}
                            <Link href="/quiz?mode=order&order=all">
                              <Card className="hover:shadow-lg hover:scale-105 transition-all duration-300 h-full bg-gradient-to-br from-primary to-primary/80 border border-primary/30">
                                <CardContent className="p-4 text-center">
                                  <span className="text-sm font-semibold text-white">全て</span>
                                </CardContent>
                              </Card>
                            </Link>
                          </div>
                        ) : (
                          <p className="text-gray-500 text-center py-4">目データが見つかりませんでした</p>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>

            {/* 右カラム: 役立ちリンク集 */}
            <div className="lg:col-span-3">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 p-8 hover:shadow-2xl transition-all duration-300">
                <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-md">
                    <ExternalLink className="h-5 w-5 text-white" />
                  </div>
                  役立ちリンク
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-semibold text-slate-700 mb-3">公式サイト</h3>
                    <div className="space-y-3">
                      <a 
                        href="https://www.wbsj.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl hover:shadow-md hover:scale-105 transition-all duration-300 border border-slate-200/50"
                      >
                        <div className="text-sm font-semibold text-slate-800">日本野鳥の会</div>
                        <div className="text-xs text-slate-500 mt-1">公式ウェブサイト</div>
                      </a>
                      
                      <a 
                        href="https://www.wbsj.org/activity/examination/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl hover:shadow-md hover:scale-105 transition-all duration-300 border border-slate-200/50"
                      >
                        <div className="text-sm font-semibold text-slate-800">野鳥識別士試験</div>
                        <div className="text-xs text-slate-500 mt-1">試験概要・申込</div>
                      </a>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-slate-700 mb-3">学習リソース</h3>
                    <div className="space-y-3">
                      <a 
                        href="https://www.suntory.co.jp/eco/birds/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl hover:shadow-md hover:scale-105 transition-all duration-300 border border-slate-200/50"
                      >
                        <div className="text-sm font-semibold text-slate-800">愛鳥週間</div>
                        <div className="text-xs text-slate-500 mt-1">野鳥図鑑・鳴き声</div>
                      </a>
                      
                      <a 
                        href="https://ebird.org/japan"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl hover:shadow-md hover:scale-105 transition-all duration-300 border border-slate-200/50"
                      >
                        <div className="text-sm font-semibold text-slate-800">eBird Japan</div>
                        <div className="text-xs text-slate-500 mt-1">野鳥観察記録</div>
                      </a>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-slate-700 mb-3">参考書籍</h3>
                    <div className="space-y-3">
                      <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl border border-slate-200/50 shadow-sm">
                        <div className="text-sm font-semibold text-slate-800">日本の野鳥識別図鑑</div>
                        <div className="text-xs text-slate-500 mt-1">試験対策の定番書</div>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl border border-slate-200/50 shadow-sm">
                        <div className="text-sm font-semibold text-slate-800">野鳥の生態学入門</div>
                        <div className="text-xs text-slate-500 mt-1">生態問題の対策に</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
