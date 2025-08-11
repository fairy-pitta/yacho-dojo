"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";

export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <header role="banner" className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          {/* ロゴ */}
          <Link href="/" className="flex items-center space-x-2" data-testid="logo">
            <div className="h-7 w-7 rounded bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">鳥</span>
            </div>
            <span className="font-bold text-lg text-foreground">野鳥識別士道場</span>
          </Link>

          {/* ナビゲーションメニュー（ログイン時のみ表示） */}
          {user && (
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-foreground hover:text-primary transition-colors text-sm font-medium">
                ホーム
              </Link>
              <Link href="/quiz" className="text-foreground hover:text-primary transition-colors text-sm font-medium">
                問題演習
              </Link>
              <Link href="/results" className="text-foreground hover:text-primary transition-colors text-sm font-medium">
                成績
              </Link>
            </nav>
          )}

          {/* ユーザーメニュー */}
          <div className="flex items-center space-x-3" data-testid="user-menu">
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {user.email?.split('@')[0]}
                </span>
                <Button variant="outline" size="sm" onClick={handleSignOut} className="text-xs">
                  ログアウト
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login">
                  <Button variant="outline" size="sm" className="text-xs">
                    ログイン
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button size="sm" className="text-xs">
                    新規登録
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}