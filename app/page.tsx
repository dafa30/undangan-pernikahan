'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
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
  Map,
  Copy,
  Check,
  CreditCard,
  Smartphone,
  QrCode,
  Mail,
  ChevronUp,
  Play,
  Pause,
} from 'lucide-react';

import { greatVibes } from "@/app/fonts";

export default function WeddingInvitation() {

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

  const [guestBook, setGuestBook] = useState<
    {
      id?: number;
      name: string;
      attendance: string;
      wish: string;
      created_at?: string;
    }[]
  >([]);

  const [loadingWish, setLoadingWish] = useState(false);

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

  // =========================
  // GUEST NAME
  // =========================
  const [guestName, setGuestName] = useState('Nama Tamu');

  async function loadGuestBook() {
  const data = await getWishes();
  setGuestBook(data);
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

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const to = urlParams.get('to');
      if (to) {
        setGuestName(to);
      }
    }

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
    setIsOpened(true);

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
        alert("Silakan isi nama.");
        return;
      }

      const wish = formattedWish || rawWish;

      if (!wish.trim()) {
        alert("Silakan isi doa atau ucapan.");
        return;
      }

      setLoadingWish(true);

      const result = await addWish({
        name,
        attendance,
        wish,
      });

      setLoadingWish(false);

      if (!result.success) {
        alert(result.message);
        return;
      }

      alert("Terima kasih atas doa dan konfirmasinya ❤️");

      setName("");
      setAttendance("Hadir");
      setRawWish("");
      setFormattedWish("");

      loadGuestBook();
  };

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

    useEffect(() => {
    loadGuestBook();

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
      supabase.removeChannel(channel);
    };
  }, []);

  const totalHadir = guestBook.filter((g) => g.attendance === "Hadir").length;
  const totalTidakHadir = guestBook.filter(
    (g) => g.attendance === "Tidak Hadir"
  ).length;

  return (
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
            initial={{ y: 0 }}
            exit={{ y: '-100vh', opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center text-white px-6 py-12 overflow-hidden"          >
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/screen.png')" }}
              />
            </div>

            {/* Latar Belakang Gradasi yang Lebih Tajam */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute inset-0 bg-black/25"
            />

            <div className="z-10 flex flex-col items-center justify-center h-full text-center">

            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
             <p className="text-xs md:text-sm uppercase tracking-[0.6em] text-white/90 mb-6">
              THE WEDDING OF
            </p>

          <h1
            className={`${greatVibes.className} text-[2.6rem] sm:text-[4.5rem] md:text-[8rem] text-white leading-tight drop-shadow-2xl`}
          >
            Dafa <span className="text-[#d8e6c9]">&</span> Taniyah
          </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-20"
            >
              <p className="text-sm uppercase tracking-[0.25em] text-white">
                KEPADA YTH.
              </p>

              <p className="mt-4 text-lg md:text-xl uppercase tracking-wide text-white">
                BAPAK / IBU / SAUDARA / I
              </p>

              <h2 className="mt-4 text-3xl md:text-4xl font-serif text-white">
                {guestName}
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-20"
            >
              <button
                onClick={handleOpenInvitation}
                className="flex items-center gap-3 bg-white hover:bg-[#edf4e5] text-[#2b3824] px-10 py-4 rounded-full uppercase tracking-[0.25em] text-xs font-semibold transition-all shadow-2xl hover:scale-105"
              >
                <Mail size={16} />
                BUKA UNDANGAN
              </button>
            </motion.div>

          </div>

          </motion.div>
        )}
      </AnimatePresence>

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
            "Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu merasa tenteram dan kasih sayang di antara kalian."
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
            <h2 className="text-lg md:text-xl font-medium text-[#2b3824] mb-6 tracking-wide">Assalamu'alaikum Wr. Wb.</h2>
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
                  animate={{
                    y: [0, -8, 0],
                    scale: [1, 1.015, 1],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative w-56 h-72 md:w-64 md:h-80 overflow-hidden rounded-4xl border-[6px] border-white bg-[#f2f6ef] shadow-[0_25px_60px_rgba(0,0,0,0.18)]"
                >

                  <img
                    src="/dafa.jpeg"
                    alt="Foto Dafa"
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
                  animate={{
                    y: [0, -8, 0],
                    scale: [1, 1.015, 1],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative w-56 h-72 md:w-64 md:h-80 overflow-hidden rounded-4xl border-[6px] border-white bg-[#f2f6ef] shadow-[0_25px_60px_rgba(0,0,0,0.18)]"
                >

                  <img
                    src="/taniyah.jpg"
                    alt="Foto Taniyah"
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
      <section className="py-24 px-6 bg-[#fafaf8]">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp} className="text-center mb-16 relative">
            <h2 className="text-3xl md:text-4xl font-serif mb-4 text-[#2b3824] pt-6">Kisah Kami</h2>
            <div className="w-16 h-px bg-[#b1c4a1] mx-auto"></div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp} className="bg-white p-8 rounded-4xl border border-[#e5eee0]/50 text-center shadow-[0_10px_40px_-15px_rgba(124,150,104,0.08)] relative md:mt-0 overflow-hidden">
              <div className="relative z-10 w-14 h-14 bg-[#f2f6ef] text-[#678254] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#e5eee0]">
                <MessageCircle size={24} />
              </div>
              <h3 className="relative z-10 text-xl font-serif mb-2 text-[#2b3824]">Pertama Kali Kenal</h3>
              <span className="relative z-10 text-[10px] font-semibold uppercase tracking-widest text-[#96ad83] block mb-4">Tahun 2017</span>
              <p className="relative z-10 text-sm text-[#556d45] leading-relaxed">Berawal dari sapaan sederhana di dunia maya. Percakapan kecil yang perlahan mengubah hari-hari biasa menjadi rutinitas yang selalu dinanti.</p>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp} className="bg-[#37482d] p-8 rounded-4xl text-center shadow-lg relative md:mt-12 overflow-hidden">
              <div className="relative z-10 w-14 h-14 bg-[#455a38] text-white rounded-full flex items-center justify-center mx-auto mb-6 border border-[#556d45]">
                <Heart size={24} />
              </div>
              <h3 className="relative z-10 text-xl font-serif mb-2 text-white">Jadian</h3>
              <span className="relative z-10 text-[10px] font-semibold uppercase tracking-widest text-[#b1c4a1] block mb-4">Akhir 2017</span>
              <p className="relative z-10 text-sm text-[#e5eee0] leading-relaxed">Jarak tidak menjadi penghalang. Kami memutuskan untuk saling mengikat komitmen satu sama lain.</p>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp} className="bg-white p-8 rounded-4xl border border-[#e5eee0]/50 text-center shadow-[0_10px_40px_-15px_rgba(124,150,104,0.08)] relative md:mt-24 overflow-hidden">
              <div className="relative z-10 w-14 h-14 bg-[#f2f6ef] text-[#678254] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#e5eee0]">
                <Coffee size={24} />
              </div>
              <h3 className="relative z-10 text-xl font-serif mb-2 text-[#2b3824]">Pertama Kali Ketemu</h3>
              <span className="relative z-10 text-[10px] font-semibold uppercase tracking-widest text-[#96ad83] block mb-4">Awal 2018</span>
              <p className="relative z-10 text-sm text-[#556d45] leading-relaxed">Setelah sekian lama hanya bertukar suara dan pesan, momen pertemuan pertama itu akhirnya tiba. Canggung sebentar, lalu terasa seperti sudah saling kenal sangat lama.</p>
            </motion.div>
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
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp} className="col-span-2 row-span-2 aspect-square bg-[#f2f6ef] rounded-4xl border border-[#e5eee0] group overflow-hidden relative">
              <img src="/datan4.jpg" alt="Foto 1" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp} className="aspect-square bg-[#f2f6ef] rounded-3xl border border-[#e5eee0] overflow-hidden group relative">
              <img src="/datan2.jpg" alt="Foto 2" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp} className="aspect-square bg-[#f2f6ef] rounded-3xl border border-[#e5eee0] overflow-hidden group relative">
              <img src="/datan3.jpg" alt="Foto 3" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeInUp} className="col-span-2 aspect-2/1 bg-[#f2f6ef] rounded-3xl border border-[#e5eee0] overflow-hidden group relative">
              <img src="/datan1.jpeg" alt="Foto 4" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
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

          <img
            src="/qr_lokasi.png"
            alt="QR Code Lokasi"
            className="w-64 md:w-80 rounded-2xl bg-white p-3 shadow-xl transition duration-500 hover:scale-105"
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

              <img
                src="/bca.png"
                alt="BCA"
                className="w-24 mx-auto mb-5 object-contain hover:scale-110 transition"
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

              <img
                src="/dana.jpg"
                alt="DANA"
                className="w-24 mx-auto mb-5 object-contain hover:scale-110 transition"
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

              <img
                src="/bca.png"
                alt="BCA"
                className="w-24 mx-auto mb-5 object-contain hover:scale-110 transition"
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
              <img
                src="/qris.png"
                alt="QRIS"
                className="w-24 mx-auto mb-5 object-contain hover:scale-110 transition"
              />
            </div>

            <div className="relative z-10 mx-auto mt-6 w-fit rounded-4xl bg-[#fafaf8] p-4 shadow-[0_30px_80px_-35px_rgba(49,65,37,0.45)]">
              <img
                src="/qris2.jpg"
                alt="QRIS"
                className="w-64 md:w-80 rounded-[1.75rem] object-cover"
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
                <p className="text-[#f2f6ef] font-serif italic leading-relaxed text-sm md:text-base mt-2">"{formattedWish}"</p>
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
            guestBook.map((guest, index) => (
              <div
                key={guest.id ?? index}
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
              </div>
            ))
          )}

        </div>
      </motion.div>
    </section>
      {/* FOOTER */}
      <footer className="py-12 text-center text-[#96ad83] text-xs tracking-widest uppercase bg-[#fafaf8]">
        <p>&copy; 2027 Dafa & Taniyah. Crafted with Next.js.</p>
      </footer>
    </main>
  );
}
