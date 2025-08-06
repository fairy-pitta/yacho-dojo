import Link from "next/link";

export function Footer() {
  return (
    <footer role="contentinfo" className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* サイト情報 */}
          <div className="flex items-center space-x-2">
            <div className="h-5 w-5 rounded bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xs">鳥</span>
            </div>
            <span className="font-bold text-sm text-foreground">野鳥識別士道場</span>
          </div>

          {/* ナビゲーション */}
          <nav className="flex items-center space-x-6">
            <Link href="/quiz" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              問題演習
            </Link>
            <Link href="/results" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              成績
            </Link>
          </nav>

          {/* コピーライト */}
          <div className="text-xs text-muted-foreground">
            © 2024 野鳥識別士道場
          </div>
        </div>
      </div>
    </footer>
  );
}