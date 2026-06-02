import React from "react";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function TermsOfService() {
  const t = await getTranslations("Terms");

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
            {t("title")}
          </h1>
        </div>

        <div className="prose dark:prose-invert max-w-none text-muted-text dark:text-gray-300 space-y-6">
          <p>{t("lastUpdated")} {new Date().toLocaleDateString('ja-JP')}</p>

          <section>
            <h2 className="text-xl font-semibold text-foreground dark:text-white mb-3">
              {t("s1.title")}
            </h2>
            <p>{t("s1.p1")}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground dark:text-white mb-3">
              {t("s2.title")}
            </h2>
            <p>{t("s2.p1")}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground dark:text-white mb-3">
              {t("s3.title")}
            </h2>
            <p>{t("s3.p1")}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground dark:text-white mb-3">
              {t("s4.title")}
            </h2>
            <p>{t("s4.p1")}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground dark:text-white mb-3">
              {t("s5.title")}
            </h2>
            <p>{t("s5.p1")}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground dark:text-white mb-3">
              {t("s6.title")}
            </h2>
            <p>{t("s6.p1")}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground dark:text-white mb-3">
              {t("s7.title")}
            </h2>
            <p>{t("s7.p1")}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
