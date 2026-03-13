import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Props { onBack: () => void; }

const PrivacyPolicyPage = ({ onBack }: Props) => {
  const { t, lang } = useI18n();
  const isZh = lang === "zh" || lang === "ja";

  return (
    <div className="px-5 pt-12 pb-24 max-w-lg mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center active:scale-95 transition-transform">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground font-serif">{isZh ? "隐私政策" : "Privacy Policy"}</h1>
      </div>

      <div className="bg-card rounded-2xl p-5 border border-border/50 space-y-4 text-sm text-foreground/80 leading-relaxed">
        <p className="text-xs text-muted-foreground">{isZh ? "最后更新：2026年3月13日" : "Last updated: March 13, 2026"}</p>

        <section>
          <h2 className="font-bold text-foreground mb-1">{isZh ? "1. 我们收集的信息" : "1. Information We Collect"}</h2>
          <p>{isZh
            ? "我们收集您在注册和使用应用时提供的信息，包括：电子邮件地址、昵称、头像、任务数据、照片及备注。我们不会收集您的精确地理位置或通讯录信息。"
            : "We collect information you provide when registering and using the app, including: email address, display name, avatar, task data, photos, and notes. We do not collect your precise location or contacts."
          }</p>
        </section>

        <section>
          <h2 className="font-bold text-foreground mb-1">{isZh ? "2. 信息的使用" : "2. How We Use Information"}</h2>
          <p>{isZh
            ? "我们使用收集的信息来：提供和改进我们的服务、个性化您的体验、发送必要的服务通知、确保账户安全。"
            : "We use collected information to: provide and improve our services, personalize your experience, send necessary service notifications, and ensure account security."
          }</p>
        </section>

        <section>
          <h2 className="font-bold text-foreground mb-1">{isZh ? "3. 数据存储与安全" : "3. Data Storage & Security"}</h2>
          <p>{isZh
            ? "您的数据安全存储在加密的云服务器上。我们采用行业标准的安全措施保护您的个人信息，包括传输加密和访问控制。"
            : "Your data is securely stored on encrypted cloud servers. We employ industry-standard security measures to protect your personal information, including encryption in transit and access controls."
          }</p>
        </section>

        <section>
          <h2 className="font-bold text-foreground mb-1">{isZh ? "4. 数据共享" : "4. Data Sharing"}</h2>
          <p>{isZh
            ? "我们不会出售、交易或出租您的个人信息给第三方。我们可能会在以下情况下共享信息：获得您的明确同意、遵守法律义务、保护我们的合法权益。"
            : "We do not sell, trade, or rent your personal information to third parties. We may share information when: we have your explicit consent, to comply with legal obligations, or to protect our legitimate interests."
          }</p>
        </section>

        <section>
          <h2 className="font-bold text-foreground mb-1">{isZh ? "5. 您的权利" : "5. Your Rights"}</h2>
          <p>{isZh
            ? "您有权访问、更正或删除您的个人数据。您可以随时在应用设置中管理您的数据，或联系我们请求删除账户。"
            : "You have the right to access, correct, or delete your personal data. You can manage your data in the app settings at any time, or contact us to request account deletion."
          }</p>
        </section>

        <section>
          <h2 className="font-bold text-foreground mb-1">{isZh ? "6. 儿童隐私" : "6. Children's Privacy"}</h2>
          <p>{isZh
            ? "我们的服务不面向13岁以下的儿童。如果我们发现已收集了13岁以下儿童的个人信息，我们将采取措施删除该信息。"
            : "Our services are not directed to children under 13. If we learn that we have collected personal information from a child under 13, we will take steps to delete such information."
          }</p>
        </section>

        <section>
          <h2 className="font-bold text-foreground mb-1">{isZh ? "7. 联系我们" : "7. Contact Us"}</h2>
          <p>{isZh
            ? "如果您对本隐私政策有任何问题，请通过应用内反馈功能联系我们。"
            : "If you have any questions about this Privacy Policy, please contact us through the in-app feedback feature."
          }</p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
