'use client';

import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { motion, Variants, AnimatePresence, MotionConfig, useReducedMotion } from 'framer-motion';
import { supabase } from "@/lib/lib/supabase";
import {
  enhanceWishWithAI,
  addWish,
  getWishes,
} from "./actions";

import {
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  Heart,
  Quote,
  MessageCircle,
  Coffee,
  Copy,
  Check,
  Play,
  Pause,
} from 'lucide-react';

import { greatVibes } from "@/app/fonts";
import type { Wish } from "@/lib/wish";
import { NotificationDialog, type Notification } from "./notification-dialog";
import cover from "./cover.module.css";

const storySteps = [
  {
    title: "Pertama Kali Kenal",
    date: "Tahun 2017",
    description: "Berawal dari sapaan sederhana di dunia maya. Percakapan kecil yang perlahan mengubah hari-hari biasa menjadi rutinitas yang selalu dinanti.",
    icon: MessageCircle,
  },
  {
    title: "Jadian",
    date: "Akhir 2017",
    description: "Jarak tidak menjadi penghalang. Kami memutuskan untuk saling mengikat komitmen satu sama lain.",
    icon: Heart,
  },
  {
    title: "Pertama Kali Ketemu",
    date: "Awal 2018",
    description: "Setelah sekian lama hanya bertukar suara dan pesan, momen pertemuan pertama itu akhirnya tiba. Canggung sebentar, lalu terasa seperti sudah saling kenal sangat lama.",
    icon: Coffee,
  },
];

function subscribeToGuestName(callback: () => void) {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
}

function getGuestName() {
  return new URLSearchParams(window.location.search).get("to") || "Nama Tamu";
}

export default function WeddingInvitation() {
  const shouldReduceMotion = useReducedMotion();

  // =========================
  // COUNTDOWN
  // =========================
  const [timeLeft, setTimeLeft] = useState({
    Hari: 0,
    Jam: 0,
    Menit: 0,
    Detik: 0,
  });

  // =========================
  // RSVP
  // =========================
  const [name, setName] = useState('');
  const [attendance, setAttendance] = useState('Hadir');

  const [rawWish, setRawWish] = useState('');
  const [formattedWish, setFormattedWish] = useState('');

  const [guestBook, setGuestBook] = useState<Wish[]>([]);

  const [loadingWish, setLoadingWish] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);

  const [isEnhancing, setIsEnhancing] = useState(false);

  // =========================
  // COPY REKENING
  // =========================
  const [copiedText, setCopiedText] = useState('');

  // =========================
  // MUSIC
  // =========================
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  // =========================
  // OPEN COVER
  // =========================
  const [isOpened, setIsOpened] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  // =========================
  // GUEST NAME
  // =========================
  const guestName = useSyncExternalStore(subscribeToGuestName, getGuestName, () => "Nama Tamu");

  async function loadGuestBook() {
    try {
      const data = await getWishes();
      setGuestBook(data);
    } catch (error) {
      console.error("Gagal memuat buku tamu:", error);
    }
  }

  useEffect(() => {
    const targetDate = new Date('2027-05-23T08:00:00').getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;
      setTimeLeft({
        Hari: Math.floor(difference / (1000 * 60 * 60 * 24)),
        Jam: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        Menit: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        Detik: Math.floor((difference % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleEnhanceWish = async () => {
    if (!rawWish.trim()) return;
    setIsEnhancing(true);
    const enhanced = await enhanceWishWithAI(rawWish);
    setFormattedWish(enhanced.trim());
    setIsEnhancing(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const handleToggleMusic = async () => {
    if (!audioRef.current) return;

    try {
      if (audioRef.current.paused) {
        await audioRef.current.play();
        setIsMusicPlaying(true);
      } else {
        audioRef.current.pause();
        setIsMusicPlaying(false);
      }
    } catch (err) {
      console.warn('Audio toggle failed:', err);
    }
  };

  const handleOpenInvitation = async () => {
    if (isOpening) return;
    setIsOpening(true);
    if (shouldReduceMotion) setIsOpened(true);

    if (!audioRef.current) return;

    try {
      await audioRef.current.play();
      setIsMusicPlaying(true);
    } catch (err) {
      console.warn('Audio play failed:', err);
    }
  };

  const handleSubmitRSVP = async () => {
      if (!name.trim()) {
        setNotification({ kind: "error", title: "Silakan isi nama." });
        return;
      }

      const wish = formattedWish || rawWish;

      if (!wish.trim()) {
        setNotification({ kind: "error", title: "Silakan isi doa atau ucapan." });
        return;
      }

      setLoadingWish(true);

      try {
        const result = await addWish({ name, attendance, wish });

        if (!result.success) {
          setNotification({ kind: "error", title: "Gagal mengirim RSVP", message: result.message });
          return;
        }

        setName("");
        setAttendance("Hadir");
        setRawWish("");
        setFormattedWish("");
        setNotification({
          kind: "success",
          title: "Terima kasih do'a nya ya",
          message: "Doa dan ucapanmu sangat berarti bagi kami.",
        });
        loadGuestBook();
      } catch (error) {
        console.error("Gagal mengirim RSVP:", error);
        setNotification({ kind: "error", title: "Gagal mengirim RSVP", message: "Silakan coba lagi." });
      } finally {
        setLoadingWish(false);
      }
  };

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: (index: number = 0) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut", delay: shouldReduceMotion ? 0 : index * 0.12 },
    }),
  };

    useEffect(() => {
    let active = true;
    getWishes().then((data) => {
      if (active) setGuestBook(data);
    }).catch((error) => {
      console.error("Gagal memuat buku tamu:", error);
    });

    const channel = supabase
      .channel("guestbook")

      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "wishes",
        },
        (payload) => {
          console.log("Realtime:", payload);
          loadGuestBook();
        }
      )

      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const totalHadir = guestBook.filter((g) => g.attendance === "Hadir").length;
  const totalTidakHadir = guestBook.filter(
    (g) => g.attendance === "Tidak Hadir"
  ).length;

  return (
    <MotionConfig reducedMotion="user">
    <main className={`min-h-screen bg-[#fafaf8] text-[#2b3824] font-sans overflow-x-hidden selection:bg-[#cddbc0] ${!isOpened ? 'h-screen overflow-hidden' : ''}`}>
      {/* Background music: browsers will pick the first supported source. Place your audio file in `public/` */}
      <audio ref={audioRef} loop preload="auto" aria-hidden="true">
        <source src="/di_akhir_perang.aac" type="audio/aac" />
        <source src="/music.mp3" type="audio/mpeg" />
        <source src="/music.m4a" type="audio/mp4" />
      </audio>
      
      {/* 0. SAMPUL SURAT */}
      <AnimatePresence>
        {!isOpened && (
          <motion.div 
            key="envelope"
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.2 : 0.7 }}
            className="fixed inset-0 z-50 overflow-x-hidden overflow-y-auto bg-[#063d2c] text-[#f9f0e2]"
          >
            <div aria-hidden="true" className={`${cover.curtain} absolute inset-0`} />
            <div aria-hidden="true" className={`${cover.shade} absolute inset-0`} />
            <div aria-hidden="true" className={`${cover.florals} ${cover.floralsLeft}`} />
            <div aria-hidden="true" className={`${cover.florals} ${cover.floralsRight}`} />
            <div aria-hidden="true" className={`${cover.florals} ${cover.floralsTopLeft}`} />
            <div aria-hidden="true" className={`${cover.florals} ${cover.floralsTopRight}`} />

            <div className="relative z-10 mx-auto flex min-h-full w-full max-w-xl flex-col items-center justify-center px-6 py-10 text-center sm:py-14 lg:max-w-5xl lg:py-8">
              <motion.div
                initial={shouldReduceMotion ? false : { opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <p className="font-serif text-xs uppercase tracking-[0.34em] text-[#f3e7d8]/90 sm:text-sm lg:text-xl">
                  The Wedding Of
                </p>
                <h1 className={`${greatVibes.className} mt-4 text-[3.4rem] leading-tight text-[#fff8ed] drop-shadow-lg sm:text-7xl lg:whitespace-nowrap lg:text-8xl xl:text-9xl`}>
                  Dafa <span className="text-[#d3e6c6]">&</span> Taniyah
                </h1>
              </motion.div>

              <motion.button
                type="button"
                onClick={handleOpenInvitation}
                disabled={isOpening}
                aria-label="Buka undangan"
                whileHover={shouldReduceMotion || isOpening ? undefined : { scale: 1.025 }}
                whileTap={shouldReduceMotion || isOpening ? undefined : { scale: 0.98 }}
                className={`${cover.envelope} relative mt-14 block w-full max-w-[330px] focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-[#f3e7d8] disabled:cursor-default sm:mt-16 lg:mt-12 lg:max-w-[460px] xl:max-w-[500px]`}
              >
                <span className="sr-only">Buka undangan</span>
                <span aria-hidden="true" className={cover.back} />
                <motion.span
                  aria-hidden="true"
                  className={cover.letter}
                  animate={isOpening ? { y: "-46%" } : { y: "0%" }}
                  transition={{ duration: 0.65, delay: 0.45, ease: "easeOut" }}
                  onAnimationComplete={() => {
                    if (isOpening && !shouldReduceMotion) setIsOpened(true);
                  }}
                >
                  <span className={`${greatVibes.className} text-3xl text-[#24634c] lg:text-5xl`}>D & T</span>
                  <span className="mt-1 text-[8px] uppercase tracking-[0.22em] text-[#8b7770] lg:text-xs">23 . 05 . 2027</span>
                </motion.span>
                <span aria-hidden="true" className={cover.front} />
                <motion.span
                  aria-hidden="true"
                  className={cover.flap}
                  animate={isOpening ? { rotateX: 180 } : { rotateX: 0 }}
                  transition={{ duration: 0.65, ease: "easeInOut" }}
                />
                <motion.span
                  aria-hidden="true"
                  animate={isOpening ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className={cover.seal}
                >
                  <Heart size={20} strokeWidth={1.2} />
                </motion.span>
              </motion.button>
              <p className="mt-6 text-[10px] uppercase tracking-[0.3em] text-[#f7e9dc]/90 lg:text-sm">
                {isOpening ? "Membuka undangan..." : "Ketuk amplop untuk membuka"}
              </p>

              <div className="mt-12 max-w-full sm:mt-14 lg:mt-10">
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#e9d8c8]/85 lg:text-sm">Kepada Yth. Bapak / Ibu / Saudara / i</p>
                <p className="mt-3 break-words font-serif text-xl text-[#fff8ed] sm:text-2xl lg:text-4xl">{guestName}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div inert={!isOpened}>
      {/* 1. HERO SECTION */}
      <section
        className="relative min-h-screen py-20 md:py-28 flex flex-col items-center justify-center text-center px-6 overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/tirai2.jpg')",
        }}
      >
        {/* Overlay (stronger on mobile for readability) */}
        <div className="absolute inset-0 bg-black/5 md:bg-black/5"></div>

        <motion.div
          initial="hidden"
          animate={isOpened ? "visible" : "hidden"}
          variants={fadeInUp}
          className="relative z-10 flex flex-col items-center"
        >
          <span className="text-xs md:text-sm uppercase tracking-[0.45em] mb-6 text-white/90 font-semibold">
            THE WEDDING OF
          </span>

          <h1
            className={`${greatVibes.className} text-[3rem] sm:text-[5rem] md:text-[8rem] text-white leading-tight drop-shadow-2xl text-center`}
          >
            Dafa
            <span className="mx-4 text-[#d8e6c9]">&</span>
            Taniyah
          </h1>

          <p className="mt-6 text-sm md:text-lg text-white/90 tracking-[0.35em] font-light">
            23 . 05 . 2027
          </p>

          {isOpened && (
            <button
              onClick={handleToggleMusic}
              aria-label={isMusicPlaying ? "Pause musik" : "Play musik"}
              className="fixed bottom-5 right-5 z-9999 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white shadow-xl transition-all duration-300 hover:bg-black/60 hover:scale-110 pointer-events-auto"
            >
              {isMusicPlaying ? (
                <Pause size={18} />
              ) : (
                <Play size={18} className="ml-0.5" />
              )}
            </button>
          )}
        </motion.div>

        {/* Ornamen */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full border border-white/15"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full border border-white/15"></div>
        </div>

        {/* Gradient Transisi */}
        <div className="absolute bottom-0 left-0 w-full h-24 bg-linear-to-b from-transparent via-[#f8f7f3]/40 to-[#f8f7f3] pointer-events-none"></div>
      </section>

      {/* 2. QUOTE SECTION */}
      <section className="relative min-h-[60vh] md:min-h-screen flex flex-col items-center justify-center text-center px-6 py-12 overflow-hidden bg-cover bg-top md:bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/section_pengantin.jpg')",
        }}>
        {/* Dim overlay so quote text is readable on small screens */}
        <div className="absolute inset-0 bg-black/5 md:bg-black/2"></div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp} className="max-w-2xl text-center relative z-10 py-12">
          <Quote className="mx-auto text-[#cddbc0] mb-6" size={32} />
          <p className="text-lg md:text-2xl font-serif text-[#455a38] leading-relaxed italic">
            &quot;Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu merasa tenteram dan kasih sayang di antara kalian.&quot;
          </p>
          <p className="mt-6 text-sm text-[#2b3824] uppercase tracking-widest">— Ar-Rum: 21</p>
        </motion.div>

        {/* Gradient Transisi */}
        <div className="absolute bottom-0 left-0 w-full h-24 bg-linear-to-b from-transparent via-[#f8f7f3]/40 to-[#f8f7f3] pointer-events-none"></div>
      </section>

      {/* 3. PROFIL MEMPELAI */}
      <section
  className="relative min-h-[70vh] md:min-h-screen flex flex-col items-center justify-center text-center px-6 py-12 overflow-hidden bg-cover bg-top md:bg-center bg-no-repeat"
  style={{
    backgroundImage: "url('/section3.jpg')",
  }}
>
  {/* Overlay premium */}
  <div className="absolute inset-0 bg-white/45 backdrop-blur-[1.5px]"></div>
  <div className="max-w-5xl mx-auto relative z-10 w-full py-12">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp} className="text-center mb-10 md:mb-16">
            <h2 className="text-lg md:text-xl font-medium text-[#2b3824] mb-6 tracking-wide">Assalamu&apos;alaikum Wr. Wb.</h2>
            <p className="text-sm md:text-base text-[#2b3824] leading-relaxed max-w-2xl mx-auto font-light">
              Tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i serta kerabat sekalian untuk menghadiri acara pernikahan kami:
            </p>
          </motion.div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24">
            
            {/* MEMPELAI PRIA */}
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="flex flex-col items-center text-center group"
            >

              <div className="relative mb-8">

                {/* Glow */}
                <div className="absolute -inset-4 rounded-[2.5rem] bg-[#d8e6c9]/30 blur-3xl opacity-70"></div>

                <motion.div
                  animate={shouldReduceMotion ? { y: 0, scale: 1 } : {
                    y: [0, -8, 0],
                    scale: [1, 1.015, 1],
                  }}
                  transition={shouldReduceMotion ? { duration: 0 } : {
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative w-56 h-72 md:w-64 md:h-80 overflow-hidden rounded-4xl border-[6px] border-white bg-[#f2f6ef] shadow-[0_25px_60px_rgba(0,0,0,0.18)]"
                >

                  <Image
                    src="/dafa.jpeg"
                    alt="Foto Dafa"
                    fill
                    sizes="(min-width: 768px) 256px, 224px"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />

                  <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-white/10"></div>

                </motion.div>

              </div>

              <h3 className="text-2xl sm:text-3xl font-serif text-[#2b3824] mb-3 leading-tight">
                Dafa Adi Raharjo, S.Kom
              </h3>

              <p className="text-[11px] sm:text-xs text-[#2b3824] uppercase tracking-[0.18em] leading-6">
                Putra Pertama dari
                <br />
                Bapak Agustinus Sutarjo & Ibu Cucu Rohana
              </p>

            </motion.div>

            {/* Simbol Dan (&) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="hidden md:flex text-6xl font-serif text-[#2b3824] font-light"
            >
              &
            </motion.div>

            {/* MEMPELAI WANITA */}
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
              className="flex flex-col items-center text-center group"
            >

              <div className="relative mb-8">

                {/* Glow */}
                <div className="absolute -inset-4 rounded-[2.5rem] bg-[#d8e6c9]/30 blur-3xl opacity-70"></div>

                <motion.div
                  animate={shouldReduceMotion ? { y: 0, scale: 1 } : {
                    y: [0, -8, 0],
                    scale: [1, 1.015, 1],
                  }}
                  transition={shouldReduceMotion ? { duration: 0 } : {
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative w-56 h-72 md:w-64 md:h-80 overflow-hidden rounded-4xl border-[6px] border-white bg-[#f2f6ef] shadow-[0_25px_60px_rgba(0,0,0,0.18)]"
                >

                  <Image
                    src="/taniyah.jpg"
                    alt="Foto Taniyah"
                    fill
                    sizes="(min-width: 768px) 256px, 224px"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />

                  <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-white/10"></div>

                </motion.div>

              </div>

              <h3 className="text-3xl font-serif text-[#2b3824] mb-3">
                Taniyah Rahman
              </h3>

              <p className="text-[11px] md:text-xs text-[#2b3824] uppercase tracking-widest leading-loose">
                Putri Pertama dari
                <br />
                Bapak Taufik Rahman & Ibu Surtini
              </p>

            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. STORY OF US */}
      <section className="py-24 px-6 bg-[#fafaf8]" aria-labelledby="story-heading">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp} className="text-center mb-16 relative">
            <h2 id="story-heading" className="text-3xl md:text-4xl font-serif mb-4 text-[#2b3824] pt-6">Kisah Kami</h2>
            <div className="w-16 h-px bg-[#b1c4a1] mx-auto"></div>
            <p className="mt-5 text-sm text-[#678254]">Perjalanan kecil yang membawa kami hingga hari ini.</p>
          </motion.div>

          <div className="relative">
            <motion.div
              aria-hidden="true"
              initial={shouldReduceMotion ? false : { scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute left-5 top-6 bottom-6 w-px origin-top bg-[#b1c4a1] md:left-1/2"
            />
            <ol className="relative space-y-8 md:space-y-12">
              {storySteps.map((step, index) => {
                const Icon = step.icon;
                const isRight = index % 2 === 1;
                return (
                  <li key={step.title} className="relative pl-14 md:grid md:grid-cols-2 md:gap-16 md:pl-0">
                    <span aria-hidden="true" className="absolute left-5 top-8 z-10 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full border border-[#96ad83] bg-[#fafaf8] md:left-1/2">
                      <span className="h-2 w-2 rounded-full bg-[#7c9668]" />
                    </span>
                    <motion.article
                      initial={{ opacity: 0, x: shouldReduceMotion ? 0 : isRight ? 28 : -28 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      className={`relative overflow-hidden rounded-[1.75rem] border border-[#dce8d4] bg-white p-6 shadow-[0_16px_45px_-25px_rgba(55,72,45,0.3)] sm:p-8 ${isRight ? "md:col-start-2" : "md:col-start-1"}`}
                    >
                      <div aria-hidden="true" className="absolute inset-2 rounded-[1.35rem] border border-[#edf3e9] pointer-events-none" />
                      <div className="relative flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f2f6ef] text-[#678254]">
                          <Icon aria-hidden="true" size={22} />
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7c9668]">{step.date}</span>
                          <h3 className="mt-2 text-xl font-serif text-[#2b3824]">{step.title}</h3>
                          <p className="mt-3 text-sm leading-relaxed text-[#556d45]">{step.description}</p>
                        </div>
                      </div>
                    </motion.article>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      {/* 5. GALLERY */}
      <section className="py-24 px-6 bg-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif mb-4 text-[#2b3824]">Galeri Bahagia</h2>
            <div className="w-16 h-px bg-[#96ad83] mx-auto"></div>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            <motion.div custom={0} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp} className="col-span-2 row-span-2 aspect-square bg-[#f2f6ef] rounded-4xl border border-[#e5eee0] group overflow-hidden relative">
              <Image src="/datan4.jpg" alt="Foto 1" fill sizes="(min-width: 768px) 480px, 100vw" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
            </motion.div>
            <motion.div custom={1} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp} className="aspect-square bg-[#f2f6ef] rounded-3xl border border-[#e5eee0] overflow-hidden group relative">
              <Image src="/datan2.jpg" alt="Foto 2" fill sizes="(min-width: 768px) 240px, 50vw" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
            </motion.div>
            <motion.div custom={2} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp} className="aspect-square bg-[#f2f6ef] rounded-3xl border border-[#e5eee0] overflow-hidden group relative">
              <Image src="/datan3.jpg" alt="Foto 3" fill sizes="(min-width: 768px) 240px, 50vw" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
            </motion.div>
            <motion.div custom={3} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp} className="col-span-2 aspect-2/1 bg-[#f2f6ef] rounded-3xl border border-[#e5eee0] overflow-hidden group relative">
              <Image src="/datan1.jpeg" alt="Foto 4" fill sizes="(min-width: 768px) 480px, 100vw" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* 6. COUNTDOWN SECTION */}
      <section className="py-24 bg-[#37482d] text-[#f2f6ef] px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp} className="text-3xl md:text-4xl font-serif mb-12 text-white">
            Menanti Hari Bahagia
          </motion.h2>
          <div className="grid grid-cols-4 gap-3 md:gap-6">
            {Object.entries(timeLeft).map(([unit, value]) => (
              <motion.div key={unit} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp} className="bg-[#455a38]/40 backdrop-blur-sm border border-[#556d45]/50 py-6 px-2 rounded-2xl flex flex-col items-center justify-center">
                <span className="text-3xl md:text-5xl font-light text-white mb-2 font-serif">{value.toString().padStart(2, '0')}</span>
                <span className="text-[10px] md:text-xs uppercase tracking-widest text-[#b1c4a1]">{unit}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. EVENT LOCATION & GMAPS */}
      <section className="py-24 px-6 bg-[#fafaf8]">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif mb-4 text-[#2b3824]">Lokasi Acara</h2>
            <div className="w-16 h-px bg-[#96ad83] mx-auto"></div>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 mb-12">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp} className="bg-white p-10 rounded-4xl shadow-[0_10px_40px_-15px_rgba(124,150,104,0.08)] border border-[#f2f6ef] relative overflow-hidden group hover:border-[#cddbc0] transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#f2f6ef] rounded-bl-full z-0 transition-transform"></div>
              
              <h3 className="text-2xl font-serif mb-2 text-[#2b3824] relative z-10">Akad Nikah</h3>
              <p className="text-sm text-[#678254] mb-8 relative z-10">Momentum suci pengikatan janji</p>
              <div className="space-y-4 text-[#455a38] text-sm relative z-10">
                <div className="flex items-center gap-4"><Calendar size={20} className="text-[#7c9668]" /> <span>Minggu, 23 Mei 2027</span></div>
                <div className="flex items-center gap-4"><Clock size={20} className="text-[#7c9668]" /> <span>08:00 WIB - Selesai</span></div>
                <div className="flex items-start gap-4"><MapPin size={20} className="text-[#7c9668] mt-1 shrink-0" /> <span>Kediaman Mempelai Wanita</span></div>
              </div>
            </motion.div>
            
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp} className="bg-[#37482d] p-10 rounded-4xl shadow-lg border border-[#455a38] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#455a38] rounded-bl-full z-0 transition-transform"></div>
              
              <h3 className="text-2xl font-serif mb-2 text-white relative z-10">Resepsi</h3>
              <p className="text-sm text-[#cddbc0] mb-8 relative z-10">Merayakan kebahagiaan bersama</p>
              <div className="space-y-4 text-[#f2f6ef] text-sm relative z-10">
                <div className="flex items-center gap-4"><Calendar size={20} className="text-[#96ad83]" /> <span>Minggu, 23 Mei 2027</span></div>
                <div className="flex items-center gap-4"><Clock size={20} className="text-[#96ad83]" /> <span>11:00 WIB - Selesai</span></div>
                <div className="flex items-start gap-4"><MapPin size={20} className="text-[#96ad83] mt-1 shrink-0" /> <span>Kediaman Mempelai Wanita</span></div>
              </div>
            </motion.div>
          </div>

          <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={fadeInUp}
          className="bg-white rounded-[2rem] border border-[#e5eee0] shadow-sm p-8 flex flex-col items-center text-center"
        >

          <div className="mb-4 px-5 py-2 rounded-full bg-[#f2f6ef] border border-[#cddbc0]">
            <span className="text-xs uppercase tracking-[0.25em] text-[#455a38] font-semibold">
              Lokasi Acara
            </span>
          </div>

          <Image
            src="/qr_lokasi.png"
            alt="QR Code Lokasi"
            width={580}
            height={580}
            className="w-64 md:w-80 h-auto rounded-2xl bg-white p-3 shadow-xl transition duration-500 hover:scale-105"
          />

          <h3 className="mt-6 text-xl font-serif text-[#2b3824]">
            Scan Disini Untuk Lokasi
          </h3>

          <p className="mt-3 text-sm text-[#678254] max-w-md leading-relaxed">
            Scan QR Code menggunakan kamera atau aplikasi Mobile Banking Anda untuk
            langsung membuka lokasi acara di Google Maps.
          </p>

        </motion.div>
        </div>
      </section>

      {/* 8. WEDDING GIFT */}
      <section className="py-24 px-6 bg-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">

          {/* Judul */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-serif mb-4 text-[#2b3824]">
              Tanda Kasih
            </h2>

            <div className="w-16 h-px bg-[#96ad83] mx-auto mb-6"></div>

            <p className="text-sm text-[#678254] max-w-lg mx-auto leading-relaxed">
              Doa restu Anda merupakan karunia yang sangat berarti bagi kami.
              Namun apabila berkenan memberikan tanda kasih, dapat melalui
              rekening ataupun dompet digital berikut.
            </p>
          </motion.div>

          {/* CARD PAYMENT */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* =================== BCA =================== */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeInUp}
              className="bg-[#fafaf8] border border-[#e5eee0] rounded-4xl p-8 text-center hover:border-[#cddbc0] hover:shadow-xl transition-all duration-300"
            >

              <Image
                src="/bca.png"
                alt="BCA"
                width={577}
                height={433}
                className="w-24 h-auto mx-auto mb-5 object-contain hover:scale-110 transition"
              />

              <p className="text-2xl font-light text-[#2b3824] mt-3">
                7111696831
              </p>

              <p className="text-xs uppercase tracking-widest text-[#678254] mb-6 mt-1">
                a.n Dafa Adi Raharjo
              </p>

              <button
                onClick={() => handleCopy("7111696831")}
                className="flex items-center justify-center gap-2 mx-auto bg-white hover:bg-[#f2f6ef] text-[#455a38] px-6 py-3 rounded-xl border border-[#e5eee0] text-xs font-semibold uppercase tracking-wider transition-all shadow-sm"
              >
                {copiedText === "7111696831"
                  ? <Check size={14}/>
                  : <Copy size={14}/>}

                {copiedText === "7111696831"
                  ? "Berhasil Disalin"
                  : "Salin Rekening"}
              </button>

            </motion.div>

            {/* =================== DANA =================== */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeInUp}
              className="bg-[#fafaf8] border border-[#e5eee0] rounded-4xl p-8 text-center hover:border-[#cddbc0] hover:shadow-xl transition-all duration-300"
            >

              <Image
                src="/dana.jpg"
                alt="DANA"
                width={1200}
                height={750}
                className="w-24 h-auto mx-auto mb-5 object-contain hover:scale-110 transition"
              />

              <p className="text-2xl font-light text-[#2b3824] mt-3">
                081384476814
              </p>

              <p className="text-xs uppercase tracking-widest text-[#678254] mb-6 mt-1">
                a.n Dafa Adi Raharjo
              </p>

              <button
                onClick={() => handleCopy("081384476814")}
                className="flex items-center justify-center gap-2 mx-auto bg-white hover:bg-[#f2f6ef] text-[#455a38] px-6 py-3 rounded-xl border border-[#e5eee0] text-xs font-semibold uppercase tracking-wider transition-all shadow-sm"
              >
                {copiedText === "081384476814"
                  ? <Check size={14}/>
                  : <Copy size={14}/>}

                {copiedText === "081384476814"
                  ? "Berhasil Disalin"
                  : "Salin Nomor"}
              </button>

            </motion.div>

            {/* =================== GOPAY =================== */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeInUp}
              className="bg-[#fafaf8] border border-[#e5eee0] rounded-4xl p-8 text-center hover:border-[#cddbc0] hover:shadow-xl transition-all duration-300"
            >

              <Image
                src="/bca.png"
                alt="BCA"
                width={577}
                height={433}
                className="w-24 h-auto mx-auto mb-5 object-contain hover:scale-110 transition"
              />

              <p className="text-2xl font-light text-[#2b3824] mt-3">
                  5875469930
              </p>

              <p className="text-xs uppercase tracking-widest text-[#678254] mb-6 mt-1">
                a.n Taniyah Rahman
              </p>

              <button
                onClick={() => handleCopy("5875469930")}
                className="flex items-center justify-center gap-2 mx-auto bg-white hover:bg-[#f2f6ef] text-[#455a38] px-6 py-3 rounded-xl border border-[#e5eee0] text-xs font-semibold uppercase tracking-wider transition-all shadow-sm"
              >
                {copiedText === "5875469930"
                  ? <Check size={14}/>
                  : <Copy size={14}/>}

                {copiedText === "5875469930"
                  ? "Berhasil Disalin"
                  : "Salin Nomor"}
              </button>

            </motion.div>

          </div>

          {/* =================== QRIS =================== */}

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeInUp}
            className="mt-8 bg-white border border-[#e5eee0] rounded-4xl p-10 text-center relative overflow-hidden shadow-xl"
          >

            <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-[#f2f6ef] blur-3xl opacity-70"></div>

            <div className="relative z-10 flex flex-col items-center">
              <Image
                src="/qris.png"
                alt="QRIS"
                width={500}
                height={500}
                className="w-24 h-auto mx-auto mb-5 object-contain hover:scale-110 transition"
              />
            </div>

            <div className="relative z-10 mx-auto mt-6 w-fit rounded-4xl bg-[#fafaf8] p-4 shadow-[0_30px_80px_-35px_rgba(49,65,37,0.45)]">
              <Image
                src="/qris2.jpg"
                alt="QRIS"
                width={305}
                height={310}
                className="w-64 md:w-80 h-auto rounded-[1.75rem] object-cover"
              />
            </div>

            <p className="mt-8 text-sm text-[#455a38] max-w-md leading-relaxed mx-auto">
              Silakan scan QRIS menggunakan aplikasi Mobile Banking,
              DANA, GoPay, OVO maupun dompet digital lainnya.
              Terima kasih atas doa dan tanda kasih yang diberikan.
            </p>

          </motion.div>

        </div>
      </section>

      {/* 9. RSVP & AI WISH */}
      <section className="py-24 bg-[#fafaf8] px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp} className="max-w-2xl mx-auto bg-white p-8 md:p-14 rounded-4xl shadow-[0_20px_40px_-15px_rgba(124,150,104,0.1)] border border-[#f2f6ef] relative overflow-hidden">
          <div className="flex justify-center mb-4 relative z-10"><Heart className="text-[#b1c4a1] fill-[#f2f6ef]" size={28} /></div>
          <h2 className="text-3xl font-serif mb-2 text-center text-[#2b3824] relative z-10">Kehadiran & Doa</h2>
          <p className="text-[#678254] text-center mb-10 text-sm relative z-10">Merupakan suatu kehormatan bagi kami jika Anda berkenan hadir.</p>
          <form className="space-y-6 relative z-10" onSubmit={(e) => { e.preventDefault(); handleSubmitRSVP(); }}>
            <div>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border-b border-[#cddbc0] py-3 px-2 focus:outline-none focus:border-[#556d45] bg-transparent transition-colors text-[#37482d] placeholder:text-[#96ad83]" placeholder="Nama Lengkap Anda" />
            </div>
            <div>

            <label className="block text-xs uppercase tracking-widest text-[#7c9668] mb-3 ml-2">
            Konfirmasi Kehadiran
            </label>

            <div className="flex gap-6">

            <label className="flex items-center gap-2 cursor-pointer">

            <input
            type="radio"
            value="Hadir"
            checked={attendance==="Hadir"}
            onChange={(e)=>setAttendance(e.target.value)}
            />

            <span className="text-sm">
            🟢 Hadir
            </span>

            </label>

            <label className="flex items-center gap-2 cursor-pointer">

            <input
            type="radio"
            value="Tidak Hadir"
            checked={attendance==="Tidak Hadir"}
            onChange={(e)=>setAttendance(e.target.value)}
            />

            <span className="text-sm">
            🔴 Tidak Hadir
            </span>

            </label>

            </div>

            </div>
            <div className="pt-4">
              <label className="block text-xs uppercase tracking-widest text-[#7c9668] mb-3 ml-2">Tuliskan Doa Anda</label>
              <textarea rows={4} value={rawWish} onChange={(e) => setRawWish(e.target.value)} className="w-full border border-[#e5eee0] p-4 focus:outline-none focus:ring-1 focus:ring-[#678254] bg-[#fafaf8] transition-all rounded-2xl text-sm resize-none" placeholder="Ketik ucapan santai, biarkan AI kami yang memperindahnya..." />
              <button type="button" onClick={handleEnhanceWish} disabled={isEnhancing || !rawWish.trim()} className="mt-4 w-full md:w-auto flex items-center justify-center gap-2 text-sm bg-white hover:bg-[#f2f6ef] text-[#455a38] py-3 px-6 rounded-xl transition-all disabled:opacity-50 font-medium border border-[#cddbc0] shadow-sm">
                <Sparkles size={16} className={isEnhancing ? "animate-spin text-[#7c9668]" : "text-[#7c9668]"} />
                {isEnhancing ? 'Menyusun kata estetis...' : 'Perindah Teks dengan AI'}
              </button>
            </div>
            {formattedWish && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#37482d] p-6 rounded-2xl mt-4 relative">
                <div className="absolute -top-3 left-6 bg-[#37482d] text-[#cddbc0] text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-[#556d45] shadow-sm">Hasil AI</div>
                <p className="text-[#f2f6ef] font-serif italic leading-relaxed text-sm md:text-base mt-2">&quot;{formattedWish}&quot;</p>
              </motion.div>
            )}
            <button type="submit" disabled={loadingWish} className="w-full bg-[#37482d] text-white py-4 rounded-xl text-sm uppercase tracking-widest hover:bg-[#455a38] transition-all disabled:opacity-50">
              {loadingWish ? "Mengirim..." : "Kirim RSVP & Doa"}
            </button>
          </form>
          <div className="mt-12 space-y-5">

          <h3 className="text-center text-2xl font-serif text-[#2b3824]">
            Ucapan & Doa
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-8">

          <div className="bg-[#fafaf8] rounded-2xl border border-[#e5eee0] p-5 text-center">
            <p className="text-3xl font-bold text-[#37482d]">
              {totalHadir}
            </p>

            <p className="text-sm text-[#678254]">
              Hadir
            </p>
          </div>

          <div className="bg-[#fafaf8] rounded-2xl border border-[#e5eee0] p-5 text-center">
            <p className="text-3xl font-bold text-[#37482d]">
              {totalTidakHadir}
            </p>

            <p className="text-sm text-[#678254]">
              Tidak Hadir
            </p>
          </div>

        </div>

          {guestBook.length === 0 ? (
            <p className="text-center text-[#678254]">
              Belum ada ucapan.
            </p>
          ) : (
            <AnimatePresence initial={false}>
            {guestBook.map((guest, index) => (
              <motion.div
                key={guest.id ?? index}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-[#fafaf8] border border-[#e5eee0] rounded-2xl p-5"
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-semibold text-[#37482d]">
                      {guest.name}
                      <span className="ml-2 text-sm text-[#678254]">
                        ({guest.attendance})
                      </span>
                    </h4>
                    {guest.wish ? (
                      <p className="mt-3 text-sm text-[#556d45] leading-relaxed">
                        {guest.wish}
                      </p>
                    ) : null}
                  </div>

                  <span className="text-xs text-[#96ad83] shrink-0">
                    {guest.created_at &&
                      new Date(guest.created_at).toLocaleString("id-ID", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                  </span>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          )}

        </div>
      </motion.div>
    </section>
      {/* FOOTER */}
      <footer className="py-12 text-center text-[#96ad83] text-xs tracking-widest uppercase bg-[#fafaf8]">
        <p>&copy; 2027 Dafa & Taniyah. Crafted with Next.js.</p>
      </footer>
      <NotificationDialog notification={notification} onClose={() => setNotification(null)} />
      </div>
    </main>
    </MotionConfig>
  );
}
