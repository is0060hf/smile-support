/*
 * Design Philosophy: 「縁側の午後」- 和モダン × ハンドクラフト
 * 
 * This page embodies the warmth and comfort of a Japanese engawa (veranda)
 * at sunset, creating a sense of home and safety for venture CEOs who
 * carry the loneliness of entrepreneurship.
 * 
 * Key Design Elements:
 * - Warm persimmon orange (#D2691E) as primary color
 * - Kinari (natural white) backgrounds with subtle texture
 * - Matcha green accents for trust and calm
 * - Serif fonts for headings (Noto Serif JP)
 * - Soft, organic shapes and hand-drawn feeling
 */

import { motion } from "framer-motion";
import { 
  Heart, 
  MapPin, 
  FileText, 
  Calendar, 
  Phone, 
  Mail, 
  Users, 
  Coffee,
  Gift,
  CheckCircle2,
  ArrowRight,
  Building2,
  Briefcase,
  Clock,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import ReCAPTCHA from "react-google-recaptcha";

// API response type
interface ContactApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 } as const
  }
};

export default function Home() {
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    message: "",
    securityAnswer: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    // Validate reCAPTCHA
    if (!recaptchaToken) {
      toast.error("reCAPTCHAの認証を完了してください。");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, recaptchaToken }),
      });

      const data: ContactApiResponse = await response.json();

      if (data.success) {
        toast.success(data.message || "お問い合わせを受け付けました。担当者より2営業日以内にご連絡いたします。");
        setFormData({ name: "", company: "", email: "", phone: "", message: "", securityAnswer: "" });
        setRecaptchaToken(null);
        recaptchaRef.current?.reset();
      } else {
        toast.error(data.error || "送信に失敗しました。しばらく経ってから再度お試しください。");
        // Reset reCAPTCHA on error
        setRecaptchaToken(null);
        recaptchaRef.current?.reset();
      }
    } catch {
      toast.error("通信エラーが発生しました。インターネット接続を確認してください。");
      setRecaptchaToken(null);
      recaptchaRef.current?.reset();
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isSubmitting, recaptchaToken]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            {/* Logo placeholder */}
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <span className="font-serif font-semibold text-lg text-foreground">すまいるサポート</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-sm text-muted-foreground hover:text-primary transition-colors">サービス内容</a>
            <a href="#welfare" className="text-sm text-muted-foreground hover:text-primary transition-colors">福利厚生オプション</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors">料金プラン</a>
            <a href="#testimonials" className="text-sm text-muted-foreground hover:text-primary transition-colors">お客様の声</a>
          </nav>
          <Button 
            className="warm-glow bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
          >
            お問い合わせ
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/hero-bg.png')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
        </div>
        
        <div className="container relative z-10">
          <motion.div 
            className="max-w-2xl"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.p 
              variants={fadeInUp}
              className="text-primary font-medium mb-4 tracking-wider"
            >
              オンライン秘書サービス
            </motion.p>
            <motion.h1 
              variants={fadeInUp}
              className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6"
            >
              孤独に戦う<br />
              <span className="text-primary hand-underline">あなたの味方</span>に<br />
              なりたい。
            </motion.h1>
            <motion.p 
              variants={fadeInUp}
              className="text-lg text-muted-foreground mb-8 leading-relaxed"
            >
              スタートアップの成功を目指し、多くを犠牲にしながら挑戦を続けるあなたへ。<br />
              すまいるサポートは、オンライン秘書業務から現地対応まで、<br />
              <span className="text-foreground font-medium">最後の拠り所として、安心できる場所</span>でありたいと願っています。
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="warm-glow bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8"
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              >
                まずは相談してみる
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-primary/30 text-primary hover:bg-primary/5"
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
              >
                サービス詳細を見る
              </Button>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path 
              d="M0 120L60 110C120 100 240 80 360 75C480 70 600 80 720 85C840 90 960 90 1080 85C1200 80 1320 70 1380 65L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
              className="fill-background"
            />
          </svg>
        </div>
      </section>

      {/* Concept Section */}
      <section className="py-20 bg-background">
        <div className="container">
          <motion.div 
            className="max-w-3xl mx-auto text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.p variants={fadeInUp} className="text-primary font-medium mb-4">Our Concept</motion.p>
            <motion.h2 variants={fadeInUp} className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-8">
              より多くの働く人の<br />
              <span className="text-primary">笑顔</span>を創ること
            </motion.h2>
            <motion.div variants={fadeInUp} className="flex justify-center mb-8">
              <img 
                src="/images/service-illustration.png" 
                alt="すまいるサポートのコンセプト" 
                className="w-64 h-64 object-cover rounded-2xl shadow-lg"
              />
            </motion.div>
            <motion.p variants={fadeInUp} className="text-muted-foreground leading-relaxed text-lg">
              才能あふれる起業家の皆さまが、本当に大切な仕事に集中できるように。<br />
              煩雑な業務や、誰かに頼みたいけど頼めない仕事を、<br />
              まるでお母さんのように温かく、確実にサポートします。
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-secondary/30">
        <div className="container">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.p variants={fadeInUp} className="text-primary font-medium mb-4">Services</motion.p>
            <motion.h2 variants={fadeInUp} className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              サービス内容
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-muted-foreground max-w-2xl mx-auto">
              オンラインでの秘書業務はもちろん、現地に赴く必要がある業務にも対応。<br />
              あなたの「困った」を、まるごとお引き受けします。
            </motion.p>
          </motion.div>

          {/* Online Services */}
          <motion.div 
            className="mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h3 variants={fadeInUp} className="font-serif text-xl font-semibold text-foreground mb-8 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-primary" />
              </span>
              オンライン秘書業務
            </motion.h3>
            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={staggerContainer}
            >
              {[
                { icon: Calendar, title: "スケジュール管理", desc: "会議の調整、リマインド、カレンダー管理を代行します" },
                { icon: Mail, title: "メール対応", desc: "受信メールの整理、返信下書き、重要メールの通知" },
                { icon: FileText, title: "資料作成", desc: "プレゼン資料、議事録、報告書などの作成をサポート" },
                { icon: Phone, title: "電話対応", desc: "代表電話の一次対応、折り返し連絡の管理" },
                { icon: Users, title: "採用サポート", desc: "応募者対応、面接日程調整、候補者管理" },
                { icon: Clock, title: "経費精算", desc: "領収書の整理、経費精算書の作成、申請代行" },
              ].map((service, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <Card className="washi-card h-full hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <service.icon className="w-6 h-6 text-primary" />
                      </div>
                      <h4 className="font-semibold text-foreground mb-2">{service.title}</h4>
                      <p className="text-sm text-muted-foreground">{service.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* On-site Services */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h3 variants={fadeInUp} className="font-serif text-xl font-semibold text-foreground mb-8 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-accent" />
              </span>
              現地対応サービス
              <span className="ml-2 text-xs font-normal text-primary bg-primary/10 px-2 py-1 rounded-full">
                他社にない強み
              </span>
            </motion.h3>
            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={staggerContainer}
            >
              {[
                { icon: Building2, title: "書類の受け取り・提出", desc: "役所、銀行、取引先への書類提出・受け取りを代行" },
                { icon: Gift, title: "手土産・贈答品の手配", desc: "お中元、お歳暮、接待用の手土産の選定・購入・発送" },
                { icon: Users, title: "来客対応", desc: "オフィスでの来客対応、会議室の準備・片付け" },
                { icon: Calendar, title: "イベント手配", desc: "会食の予約、社内イベントの会場手配・準備" },
                { icon: Sparkles, title: "オフィス環境整備", desc: "備品の補充、オフィスの整理整頓、植物の管理" },
                { icon: MapPin, title: "その他現地対応", desc: "「ちょっと誰かに頼みたい」そんな業務もご相談ください" },
              ].map((service, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <Card className="washi-card h-full hover:shadow-lg transition-shadow duration-300 border-accent/20">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                        <service.icon className="w-6 h-6 text-accent" />
                      </div>
                      <h4 className="font-semibold text-foreground mb-2">{service.title}</h4>
                      <p className="text-sm text-muted-foreground">{service.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Welfare Option Section */}
      <section id="welfare" className="py-20 bg-background">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.p variants={fadeInUp} className="text-primary font-medium mb-4">Welfare Option</motion.p>
              <motion.h2 variants={fadeInUp} className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
                福利厚生オプション<br />
                <span className="text-xl font-normal text-muted-foreground">オフィスに「ほっ」とする瞬間を</span>
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-muted-foreground mb-8 leading-relaxed">
                忙しい毎日の中で、ふと一息つける瞬間を。<br />
                オフィスにデザートや軽食、飲み物、お菓子を定期的にお届けします。<br />
                グリコのオフィスグリコや社内コンビニのような感覚で、<br />
                社員の皆さまの心と体をサポートします。
              </motion.p>
              <motion.div variants={fadeInUp}>
                <h4 className="font-semibold text-foreground mb-4">提供内容</h4>
                <ul className="space-y-3">
                  {[
                    "季節のデザート（プリン、ゼリー、焼き菓子など）",
                    "軽食（おにぎり、サンドイッチ、パンなど）",
                    "ドリンク（コーヒー、お茶、ジュースなど）",
                    "お菓子（チョコレート、クッキー、和菓子など）",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3 text-muted-foreground">
                      <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <img 
                src="/images/welfare-illustration.png" 
                alt="福利厚生オプション" 
                className="w-full rounded-2xl shadow-xl"
              />
              <div className="absolute -bottom-6 -right-6 bg-primary text-primary-foreground px-6 py-3 rounded-xl shadow-lg">
                <p className="text-sm font-medium">月額 +5万円（税別）</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-secondary/30">
        <div className="container">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.p variants={fadeInUp} className="text-primary font-medium mb-4">Pricing</motion.p>
            <motion.h2 variants={fadeInUp} className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              料金プラン
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-muted-foreground">
              シンプルな料金体系で、安心してご利用いただけます
            </motion.p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {/* Basic Plan */}
            <motion.div variants={fadeInUp}>
              <Card className="washi-card h-full relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-primary" />
                <CardContent className="p-8">
                  <h3 className="font-serif text-2xl font-bold text-foreground mb-2">基本プラン</h3>
                  <p className="text-muted-foreground mb-6">オンライン秘書 + 現地対応</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-primary">25</span>
                    <span className="text-xl text-foreground">万円</span>
                    <span className="text-muted-foreground">/月（税別）</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {[
                      "オンライン秘書業務全般",
                      "現地対応サービス",
                      "専任担当者制",
                      "平日9:00〜18:00対応",
                      "月次レポート提出",
                    ].map((item, index) => (
                      <li key={index} className="flex items-center gap-3 text-muted-foreground">
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full warm-glow bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    このプランで相談する
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* With Welfare Option */}
            <motion.div variants={fadeInUp}>
              <Card className="washi-card h-full relative overflow-hidden border-accent/30">
                <div className="absolute top-0 left-0 right-0 h-2 bg-accent" />
                <div className="absolute top-4 right-4 bg-accent text-accent-foreground text-xs font-medium px-3 py-1 rounded-full">
                  おすすめ
                </div>
                <CardContent className="p-8">
                  <h3 className="font-serif text-2xl font-bold text-foreground mb-2">福利厚生付きプラン</h3>
                  <p className="text-muted-foreground mb-6">基本プラン + 福利厚生オプション</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-accent">30</span>
                    <span className="text-xl text-foreground">万円</span>
                    <span className="text-muted-foreground">/月（税別）</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {[
                      "基本プランの全サービス",
                      "デザート・軽食の定期配送",
                      "ドリンク・お菓子の補充",
                      "季節のスペシャルメニュー",
                      "社員満足度向上サポート",
                    ].map((item, index) => (
                      <li key={index} className="flex items-center gap-3 text-muted-foreground">
                        <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full warm-glow bg-accent hover:bg-accent/90 text-accent-foreground"
                    onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    このプランで相談する
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section 
        id="testimonials" 
        className="py-20 relative"
        style={{ 
          backgroundImage: "url('/images/testimonial-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <div className="absolute inset-0 bg-background/80" />
        <div className="container relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.p variants={fadeInUp} className="text-primary font-medium mb-4">Testimonials</motion.p>
            <motion.h2 variants={fadeInUp} className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              お客様の声
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-muted-foreground">
              すまいるサポートをご利用いただいているお客様からの声をご紹介します
            </motion.p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {[
              {
                name: "田中 健太郎",
                role: "AIスタートアップ CEO",
                company: "株式会社テックフューチャー",
                content: "創業から3年、ずっと一人で全部やってきました。すまいるサポートさんに出会って、初めて「頼っていいんだ」と思えました。特に現地対応が本当に助かっています。銀行や役所に行く時間がなくて困っていたので。",
                highlight: "初めて「頼っていいんだ」と思えた"
              },
              {
                name: "佐藤 美咲",
                role: "D2Cブランド 代表",
                company: "株式会社ブルームライフ",
                content: "福利厚生オプションを導入してから、オフィスの雰囲気が明るくなりました。社員が「今日のお菓子何かな」って楽しみにしてくれていて。小さなことだけど、こういう温かさが会社を支えてくれるんだなと実感しています。",
                highlight: "小さな温かさが会社を支えてくれる"
              },
              {
                name: "山本 大輔",
                role: "SaaSスタートアップ 創業者",
                company: "株式会社クラウドワークス",
                content: "正直、最初は「秘書サービスなんて贅沢かな」と思っていました。でも今は、もっと早く頼めばよかったと思っています。孤独に戦っている経営者の気持ちを本当にわかってくれる。それが一番ありがたいです。",
                highlight: "孤独に戦う経営者の気持ちをわかってくれる"
              },
            ].map((testimonial, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="washi-card h-full">
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <p className="text-primary font-medium text-sm mb-2">「{testimonial.highlight}」</p>
                    </div>
                    <p className="text-muted-foreground mb-6 leading-relaxed text-sm">
                      {testimonial.content}
                    </p>
                    <div className="border-t border-border pt-4">
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.company}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className="py-20 relative"
        style={{ 
          backgroundImage: "url('/images/cta-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/80" />
        <div className="container relative z-10">
          <motion.div 
            className="max-w-3xl mx-auto text-center text-primary-foreground"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeInUp} className="font-serif text-3xl md:text-4xl font-bold mb-6">
              一人で抱え込まないでください
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg mb-8 opacity-90">
              あなたが本当にやるべきことに集中できるように。<br />
              まずは、お気軽にご相談ください。
            </motion.p>
            <motion.div variants={fadeInUp}>
              <Button 
                size="lg"
                className="bg-white text-primary hover:bg-white/90 text-lg px-8"
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              >
                無料相談を申し込む
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-background">
        <div className="container">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.p variants={fadeInUp} className="text-primary font-medium mb-4">Contact</motion.p>
            <motion.h2 variants={fadeInUp} className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
              お問い合わせ
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-muted-foreground">
              ご質問やご相談など、お気軽にお問い合わせください。<br />
              2営業日以内にご連絡いたします。
            </motion.p>
          </motion.div>

          <motion.div 
            className="max-w-2xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <Card className="washi-card">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        お名前 <span className="text-destructive">*</span>
                      </label>
                      <Input 
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="山田 太郎"
                        className="bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        会社名
                      </label>
                      <Input 
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="株式会社○○"
                        className="bg-background"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        メールアドレス <span className="text-destructive">*</span>
                      </label>
                      <Input 
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="example@company.com"
                        className="bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        電話番号
                      </label>
                      <Input 
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="03-1234-5678"
                        className="bg-background"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      お問い合わせ内容 <span className="text-destructive">*</span>
                    </label>
                    <Textarea 
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="ご質問やご相談内容をご記入ください"
                      rows={5}
                      className="bg-background"
                    />
                  </div>
                  <div className="bg-secondary/50 p-4 rounded-lg border border-border">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      セキュリティ確認 <span className="text-destructive">*</span>
                    </label>
                    <p className="text-sm text-muted-foreground mb-3">
                      スパム防止のため、以下の質問にお答えください。
                    </p>
                    <p className="text-sm font-medium text-foreground mb-2">
                      日本で一番高い山は何ですか？（日本語で回答）
                    </p>
                    <Input 
                      required
                      value={formData.securityAnswer}
                      onChange={(e) => setFormData({ ...formData, securityAnswer: e.target.value })}
                      placeholder="回答を入力してください"
                      className="bg-background"
                    />
                    <div className="mt-4">
                      <ReCAPTCHA
                        ref={recaptchaRef}
                        sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || ""}
                        onChange={(token) => setRecaptchaToken(token)}
                        onExpired={() => setRecaptchaToken(null)}
                        onError={() => setRecaptchaToken(null)}
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full warm-glow bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "送信中..." : "送信する"}
                    {!isSubmitting && <ArrowRight className="ml-2 w-5 h-5" />}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-foreground text-background">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-background" />
                </div>
                <span className="font-serif font-semibold text-lg">すまいるサポート</span>
              </div>
              <p className="text-sm text-background/70">
                より多くの働く人の笑顔を創ること。<br />
                それが私たちの使命です。
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">サービス</h4>
              <ul className="space-y-2 text-sm text-background/70">
                <li><a href="#services" className="hover:text-background transition-colors">オンライン秘書業務</a></li>
                <li><a href="#services" className="hover:text-background transition-colors">現地対応サービス</a></li>
                <li><a href="#welfare" className="hover:text-background transition-colors">福利厚生オプション</a></li>
                <li><a href="#pricing" className="hover:text-background transition-colors">料金プラン</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">お問い合わせ</h4>
              <ul className="space-y-2 text-sm text-background/70">
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  〒142-0042<br />東京都品川区豊町6-18-15<br />ミュージションテラス品川豊町
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-background/20 pt-8 text-center text-sm text-background/50">
            <p>&copy; 2026 すまいるサポート. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
