import Link from "next/link";

export function Footer() {
  return (
    <footer role="contentinfo" className="border-t bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* サイト情報 */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">鳥</span>
              </div>
              <span className="font-bold text-lg text-gray-900">野鳥識別士道場</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              野鳥識別士試験の合格を目指す学習サイトです。
              豊富な問題と詳細な解説で、効率的に学習を進めることができます。
            </p>
            <p className="text-xs text-gray-500">
              © 2024 野鳥識別士道場. All rights reserved.
            </p>
          </div>

          {/* 学習メニュー */}
          <div>
            <h3 className="font-semibold text-sm mb-3 text-gray-900">学習</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/quiz" className="text-gray-600 hover:text-gray-900 transition-colors">
                  クイズ
                </Link>
              </li>
              <li>
                <Link href="/study" className="text-gray-600 hover:text-gray-900 transition-colors">
                  学習資料
                </Link>
              </li>
              <li>
                <Link href="/results" className="text-gray-600 hover:text-gray-900 transition-colors">
                  成績確認
                </Link>
              </li>
              <li>
                <Link href="/progress" className="text-gray-600 hover:text-gray-900 transition-colors">
                  学習進捗
                </Link>
              </li>
            </ul>
          </div>

          {/* サポート */}
          <div>
            <h3 className="font-semibold text-sm mb-3 text-gray-900">サポート</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help" className="text-gray-600 hover:text-gray-900 transition-colors">
                  ヘルプ
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-600 hover:text-gray-900 transition-colors">
                  よくある質問
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">
                  お問い合わせ
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-gray-900 transition-colors">
                  プライバシーポリシー
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* ボトムバー */}
        <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-xs text-gray-500 mb-4 md:mb-0">
            野鳥識別士試験は公益財団法人日本鳥類保護連盟が実施する試験です。
          </div>
          <div className="flex space-x-4 text-xs">
            <Link href="/terms" className="text-gray-600 hover:text-gray-900 transition-colors">
              利用規約
            </Link>
            <Link href="/privacy" className="text-gray-600 hover:text-gray-900 transition-colors">
              プライバシーポリシー
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}