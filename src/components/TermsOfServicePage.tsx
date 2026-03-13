import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Props { onBack: () => void; }

const TermsOfServicePage = ({ onBack }: Props) => {
  const { lang } = useI18n();
  const isZh = lang === "zh" || lang === "ja";

  return (
    <div className="px-5 pt-12 pb-24 max-w-lg mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center active:scale-95 transition-transform">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground font-serif">{isZh ? "用户协议" : "Terms of Service"}</h1>
      </div>

      <div className="bg-card rounded-2xl p-5 border border-border/50 space-y-4 text-sm text-foreground/80 leading-relaxed">
        <p className="text-xs text-muted-foreground">{isZh ? "最后更新：2026年3月13日" : "Last updated: March 13, 2026"}</p>

        <section>
          <h2 className="font-bold text-foreground mb-1">{isZh ? "1. 服务说明" : "1. Service Description"}</h2>
          <p>{isZh
            ? "本应用是一款生活记录与任务管理工具，帮助用户记录日常生活、管理任务并培养虚拟猫咪。使用本服务即表示您同意遵守本协议。"
            : "This app is a life journaling and task management tool that helps users record daily life, manage tasks, and raise a virtual cat. By using this service, you agree to comply with these terms."
          }</p>
        </section>

        <section>
          <h2 className="font-bold text-foreground mb-1">{isZh ? "2. 账户注册" : "2. Account Registration"}</h2>
          <p>{isZh
            ? "您需要提供有效的电子邮件地址来创建账户。您有责任维护账户安全并对账户下的所有活动负责。"
            : "You need to provide a valid email address to create an account. You are responsible for maintaining account security and for all activities under your account."
          }</p>
        </section>

        <section>
          <h2 className="font-bold text-foreground mb-1">{isZh ? "3. 用户内容" : "3. User Content"}</h2>
          <p>{isZh
            ? "您保留您上传内容（包括照片、文字等）的所有权。我们不会在未经您同意的情况下使用您的内容用于其他目的。您不得上传违法、侵权或不当的内容。"
            : "You retain ownership of all content you upload (including photos, text, etc.). We will not use your content for other purposes without your consent. You must not upload illegal, infringing, or inappropriate content."
          }</p>
        </section>

        <section>
          <h2 className="font-bold text-foreground mb-1">{isZh ? "4. 服务变更" : "4. Service Changes"}</h2>
          <p>{isZh
            ? "我们保留随时修改或终止服务（或其任何部分）的权利，恕不另行通知。我们对服务的任何修改、暂停或终止不承担责任。"
            : "We reserve the right to modify or discontinue the service (or any part thereof) at any time without notice. We shall not be liable for any modification, suspension, or discontinuation of the service."
          }</p>
        </section>

        <section>
          <h2 className="font-bold text-foreground mb-1">{isZh ? "5. 免责声明" : "5. Disclaimer"}</h2>
          <p>{isZh
            ? "本服务按"原样"提供，不提供任何形式的保证。我们不保证服务不会中断、及时、安全或无错误。"
            : "The service is provided \"as is\" without warranties of any kind. We do not guarantee that the service will be uninterrupted, timely, secure, or error-free."
          }</p>
        </section>

        <section>
          <h2 className="font-bold text-foreground mb-1">{isZh ? "6. 协议更新" : "6. Updates to Terms"}</h2>
          <p>{isZh
            ? "我们可能会不时更新本协议。更新后继续使用服务即表示您接受修改后的协议。"
            : "We may update these terms from time to time. Continued use of the service after updates constitutes acceptance of the modified terms."
          }</p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
