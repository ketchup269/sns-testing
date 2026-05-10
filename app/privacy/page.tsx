import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8 bg-card dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-card-border dark:border-gray-700">
        <div className="flex items-center space-x-4 mb-8">
          <Link
            href="/"
            className="text-muted-text hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold text-foreground dark:text-white">
            プライバシーポリシー
          </h1>
        </div>

        <div className="prose dark:prose-invert max-w-none text-muted-text dark:text-gray-300 space-y-6">
          <p>最終更新日: {new Date().toLocaleDateString('ja-JP')}</p>

          <section>
            <h2 className="text-xl font-semibold text-foreground dark:text-white mb-3">
              1. 収集する情報
            </h2>
            <p>
              本サービスを利用してInstagram投稿を自動化する際、以下の情報を収集します：
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                <strong>アカウント情報：</strong>お名前、メールアドレス、認証情報。
              </li>
              <li>
                <strong>ソーシャルメディアデータ：</strong>お客様がFacebookまたはInstagramアカウントを連携する際、投稿の代理公開・プロフィール情報の取得・ページメトリクスの読み取りに必要なアクセストークンを受取ります。
              </li>
              <li>
                <strong>利用データ：</strong>スケジュール・公開した投稿を含む、プラットフォームの利用状況に関する情報。
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground dark:text-white mb-3">
              2. 情報の利用目的
            </h2>
            <p>収集した情報は以下の目的に利用します：</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>サービスの提供・維持・改善のため。</li>
              <li>
                アカウントの認証およびInstagram/Facebook APIとの連携促進のため。
              </li>
              <li>ソーシャルメディアコンテンツのスケジューリングおよび自動公開のため。</li>
              <li>アップデート・サポート・通知に関する連絡のため。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground dark:text-white mb-3">
              3. 情報の共有と第三者サービス
            </h2>
            <p>
              本アプリケーションはMeta Graph APIを通じてFacebookもしくはInstagramと連携しています。本サービスを利用することにより、これら第三者のプライバシーポリシーに同意したことになります。
            </p>
            <p className="mt-2">
              お客様の個人情報を第三者に売る、市場取引、貸出することはありません。アプリケーション靈業を支援する信頼できるサービスプロバイダーとのみ情報を共有する場合がありますが、その際は機密保持を約束した場合に限られます。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground dark:text-white mb-3">
              4. データの保持と削除
            </h2>
            <p>
              サービスの提供に必要な期間のみ、個人情報およびソーシャルメディアトークンを保持します。ダッシュボードからアカウントの連携を難除することで、いつでもトークンへのアクセスを撤回できます。
            </p>
            <p className="mt-2">
              アカウントおよび関連する全データの完全削除をご希望の場合は、お問い合わせください。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground dark:text-white mb-3">
              5. セキュリティ
            </h2>
            <p>
              業界標準のセキュリティ対策を実施し、格許のないアクセス・改ざん・漏洩から個人情報およびソーシャルメディアアクセストークンを保護します。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground dark:text-white mb-3">
              6. プライバシーポリシーの変更
            </h2>
            <p>
              本プライバシーポリシーは適宜更新されることがあります。重要な変更がある場合は、このページに新しいポリシーを挈載し、「最終更新日」を更新することでお知らせします。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground dark:text-white mb-3">
              7. お問い合わせ
            </h2>
            <p>
              本ポリシーに関するご質問およびご不明な点は、お気軽にサポートまでお問い合わせください。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
