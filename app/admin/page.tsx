"use client";

import { useEffect, useState } from "react";
import {getWishes,deleteWish,} from "../actions";
import { Trash2 } from "lucide-react";
import { supabase } from "@/lib/lib/supabase";
import type { Wish } from "@/lib/wish";
import { NotificationDialog, type Notification } from "../notification-dialog";


export default function AdminPage() {
    const [guestBook, setGuestBook] = useState<Wish[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [notification, setNotification] = useState<Notification | null>(null);

    const loadData = async () => {

    try {
        const data = await getWishes();
        setGuestBook(data);
    } catch (error) {
        console.error("Gagal memuat RSVP:", error);
    } finally {
        setLoading(false);
    }

    };

    useEffect(() => {

    let active = true;
    getWishes().then((data) => {
        if (active) {
            setGuestBook(data);
            setLoading(false);
        }
    }).catch((error) => {
        console.error("Gagal memuat RSVP:", error);
        if (active) setLoading(false);
    });

    const channel = supabase
        .channel("admin-wishes")

        .on(
        "postgres_changes",
        {
            event: "*",
            schema: "public",
            table: "wishes",
        },
        () => {
            loadData();
        }
        )

        .subscribe();

    return () => {
        active = false;
        supabase.removeChannel(channel);
    };

    }, []);

    const handleDelete = async (id: number) => {
    try {
        const result = await deleteWish(id);
        if (result.success) {
            await loadData();
        } else {
            setNotification({ kind: "error", title: "Gagal menghapus ucapan", message: result.message });
        }
    } catch (error) {
        console.error("Gagal menghapus ucapan:", error);
        setNotification({ kind: "error", title: "Gagal menghapus ucapan", message: "Silakan coba lagi." });
    }
    };

    const hadir = guestBook.filter(
    (item) => item.attendance === "Hadir"
    ).length;

    const tidakHadir = guestBook.filter(
    (item) => item.attendance === "Tidak Hadir"
    ).length;

    const filteredGuest = guestBook.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="min-h-screen bg-[#f5f7f2] p-8">

        <div className="max-w-6xl mx-auto">

        <h1 className="text-4xl font-bold text-[#37482d] mb-10">
            Admin Dashboard
        </h1>

        {/* Statistik */}

        <div className="grid md:grid-cols-3 gap-5 mb-10">

            <div className="bg-white rounded-3xl shadow-lg p-8 text-center">

            <h2 className="text-gray-500">
                Total RSVP
            </h2>

            <p className="text-5xl font-bold text-[#37482d] mt-3">
                {guestBook.length}
            </p>

            </div>

            <div className="bg-white rounded-3xl shadow-lg p-8 text-center">

            <h2 className="text-gray-500">
                Hadir
            </h2>

            <p className="text-5xl font-bold text-green-600 mt-3">
                {hadir}
            </p>

            </div>

            <div className="bg-white rounded-3xl shadow-lg p-8 text-center">

            <h2 className="text-gray-500">
                Tidak Hadir
            </h2>

            <p className="text-5xl font-bold text-red-500 mt-3">
                {tidakHadir}
            </p>

            </div>
            <NotificationDialog notification={notification} onClose={() => setNotification(null)} />
        </div>

        {/* Search */}

        <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari Nama..."
            className="w-full mb-8 p-4 rounded-2xl border bg-white"
        />

        {/* Loading */}

        {loading && (

            <div className="text-center">
            Loading...
            </div>

        )}

        {/* Data */}

        <div className="space-y-5">

            {filteredGuest.map((item) => (

            <div
                key={item.id}
                className="bg-white rounded-3xl shadow p-6"
            >

                <div className="flex justify-between items-start">

                <div>

                    <h2 className="text-2xl font-bold">
                    {item.name}
                    </h2>

                    <p
                    className={`mt-1 font-semibold ${
                        item.attendance === "Hadir"
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                    >
                    {item.attendance}
                    </p>

                </div>

                <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-xl bg-red-50 hover:bg-red-500 text-red-500 hover:text-white transition-all duration-300"
                    >
                    <Trash2 size={18} />
                </button>

                </div>

                <p className="mt-5 text-gray-600 italic">
                &quot;{item.wish}&quot;
                </p>
            </div>
            ))}

        </div>

        </div>

    </div>
    );
}