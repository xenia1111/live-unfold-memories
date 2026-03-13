import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, Lock, User, ArrowRight, Sparkles } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("请填写邮箱和密码");
      return;
    }
    if (!isLogin && password.length < 6) {
      toast.error("密码至少6位");
      return;
    }
    if (!isLogin && !agreedTerms) {
      toast.error("请先阅读并同意隐私政策和用户协议");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("登录成功！");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || "探索者" },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("注册成功！请查看邮箱完成验证");
      }
    } catch (error: any) {
      const msg = error.message?.includes("Invalid login")
        ? "邮箱或密码不正确"
        : error.message?.includes("already registered")
        ? "该邮箱已注册，请直接登录"
        : error.message || "操作失败";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Inline legal page views
  if (showPrivacy) {
    const PrivacyPolicyPage = require("@/components/PrivacyPolicyPage").default;
    return <PrivacyPolicyPage onBack={() => setShowPrivacy(false)} />;
  }
  if (showTerms) {
    const TermsOfServicePage = require("@/components/TermsOfServicePage").default;
    return <TermsOfServicePage onBack={() => setShowTerms(false)} />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo area */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-3xl gradient-warm mx-auto mb-4 flex items-center justify-center shadow-lg animate-float">
            <Sparkles size={36} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground font-serif">展记</h1>
          <p className="text-sm text-muted-foreground mt-1">记录生活，喂养你的小猫咪</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="你的昵称（选填）"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="pl-10 h-12 rounded-2xl bg-card border-border/50"
              />
            </div>
          )}

          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              placeholder="邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12 rounded-2xl bg-card border-border/50"
              autoComplete="email"
            />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="password"
              placeholder="密码（至少6位）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12 rounded-2xl bg-card border-border/50"
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>

          {/* Agreement checkbox — only for signup */}
          {!isLogin && (
            <div className="flex items-start gap-2.5 px-1">
              <Checkbox
                id="agree-terms"
                checked={agreedTerms}
                onCheckedChange={(v) => setAgreedTerms(v === true)}
                className="mt-0.5"
              />
              <label htmlFor="agree-terms" className="text-xs text-muted-foreground leading-relaxed">
                我已阅读并同意{" "}
                <button type="button" onClick={() => setShowPrivacy(true)} className="text-primary underline underline-offset-2">
                  隐私政策
                </button>{" "}
                和{" "}
                <button type="button" onClick={() => setShowTerms(true)} className="text-primary underline underline-offset-2">
                  用户协议
                </button>
              </label>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || (!isLogin && !agreedTerms)}
            className="w-full h-12 rounded-2xl text-base font-medium gap-2"
          >
            {loading ? (
              <span className="animate-pulse">处理中...</span>
            ) : (
              <>
                {isLogin ? "登录" : "注册"}
                <ArrowRight size={16} />
              </>
            )}
          </Button>
        </form>

        {/* Toggle */}
        <div className="text-center mt-6">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {isLogin ? "还没有账号？去注册" : "已有账号？去登录"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
