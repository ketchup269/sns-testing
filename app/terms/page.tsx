import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
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
            利用規約
          </h1>
        </div>

        <div className="prose dark:prose-invert max-w-none text-muted-text dark:text-gray-300 space-y-6">
          <p>最終更新日: {new Date().toLocaleDateString('ja-JP')}</p>

          <section>
            <h2 className="text-xl font-semibold text-foreground dark:text-white mb-3">
              1. 利用規約への同意
            </h2>
            <p>
              本インスタグラム自動化ツールを利用することにより、この利用規約に同意したことになります。規約の一部に同意できない場合は、本サービスへのアクセス権限は付与されません。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground dark:text-white mb-3">
              2. アカウントと連携
            </h2>
            <p>
              アカウント作成およびソーシャルメディアプロフィール（Facebook/Instagram）を連携する際、当該プロフィールへのアクセス権限を付与する権利および権限を有することを保証していただきます。サービスへのアクセスに使用するパスワードの管理およびそのパスワード下での活動に対して貿任を負うものとします。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground dark:text-white mb-3">
              3. Meta APIの利用
            </h2>
            <p>
              本アプリケーションはMeta Graph APIを利用しています。本サービスを利用することにより、FacebookおよびInstagramの利用規約とコミュニティガイドラインにも遵守するものとします。スパム・不適切・違法なコンテンツの投稿に本ツールを使用した場合、アカウントは即時停止され、Metaプラットフォームから利用禁止となる可能性があります。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground dark:text-white mb-3">
              4. サービスの信頼性
            </h2>
            <p>
              投稿の時間通りの公開に最善を尽くします。ただし、本サービスはMetaなどサードパーティAPIに依存しており、公開失敗・APIレート制限・トークン失効・外部要因によるダウンタイムについて責任を負いかねます。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground dark:text-white mb-3">
              5. 解約
            </h2>
            <p>
              当社は、利用規約違反を含むいかなる理由によっても、事前の通知または責任なく、即時にアカウントを停止または展間する権利を留保します。解約後、サービスへのアクセス権は即時消滅します。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground dark:text-white mb-3">
              6. 変更
            </h2>
            <p>
              当社は、単独の裁量により、いつでも利用規約を変更または更新する権利を留保します。変更後も引き続きサービスを利用した場合、改訂後の視西に同意したものとみなします。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground dark:text-white mb-3">
              7. お問い合わせ
            </h2>
            <p>
              本利用規約に関するご質問は、お気軽にお問い合わせください。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
