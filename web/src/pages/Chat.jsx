import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { MessageCircle, Send, Users } from "lucide-react";

export default function Chat() {
    const [channels, setChannels] = useState([]);
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const token = localStorage.getItem("accessToken");

    // Kullanıcı bilgisi
    const [userId, setUserId] = useState(null);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                setUserId(payload.id);
                setUserRole(payload.role);
            } catch (e) {
                console.error("Token çözümleme hatası:", e);
            }
        }
    }, [token]);

    // Kanalları getir
    const fetchChannels = async () => {
        try {
            const res = await axios.get("http://localhost:5000/chats/channels", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setChannels(res.data.data || []);
            if (res.data.data && res.data.data.length > 0 && !selectedChannel) {
                setSelectedChannel(res.data.data[0]);
            }
        } catch (err) {
            console.error("Kanallar yüklenirken hata:", err);
        } finally {
            setLoading(false);
        }
    };

    // Mesajları getir
    const fetchMessages = async (channelId) => {
        try {
            const res = await axios.get(
                `http://localhost:5000/chats/channels/${channelId}/messages`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setMessages(res.data.data || []);
            scrollToBottom();
        } catch (err) {
            console.error("Mesajlar yüklenirken hata:", err);
        }
    };

    // Mesaj gönder
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChannel) return;

        setSending(true);
        try {
            const res = await axios.post(
                `http://localhost:5000/chats/channels/${selectedChannel.id}/messages`,
                { content: newMessage },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setNewMessage("");
            // Mesajları yeniden yükle
            await fetchMessages(selectedChannel.id);
            // Kanalları güncelle (son mesaj için)
            await fetchChannels();
        } catch (err) {
            console.error("Mesaj gönderilirken hata:", err);
            alert("Mesaj gönderilemedi: " + (err.response?.data?.message || "Bilinmeyen hata"));
        } finally {
            setSending(false);
        }
    };

    // Kanal değiştiğinde mesajları yükle
    useEffect(() => {
        if (selectedChannel) {
            fetchMessages(selectedChannel.id);
            // Her 3 saniyede bir mesajları yenile
            const interval = setInterval(() => {
                fetchMessages(selectedChannel.id);
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [selectedChannel]);

    // İlk yükleme
    useEffect(() => {
        fetchChannels();
    }, []);

    // Mesajlar değiştiğinde scroll
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const getChannelTypeLabel = (type) => {
        switch (type) {
            case "teachers":
                return "👨‍🏫 Öğretmenler";
            case "teachers_manager":
                return "👨‍💼 Öğretmenler & Müdür";
            case "class":
                return "🎓 Sınıf";
            default:
                return type;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                Yükleniyor...
            </div>
        );
    }

    if (channels.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <h1 className="text-3xl font-bold mb-8 text-center">💬 Sohbet</h1>
                <div className="bg-white rounded-2xl shadow p-8 text-center">
                    <MessageCircle size={64} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">
                        Henüz erişebileceğiniz sohbet kanalı bulunmuyor.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sol Panel - Kanallar */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Users size={20} />
                        Sohbet Kanalları
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {channels.map((channel) => (
                        <div
                            key={channel.id}
                            onClick={() => setSelectedChannel(channel)}
                            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-indigo-50 transition ${
                                selectedChannel?.id === channel.id ? "bg-indigo-100" : ""
                            }`}
                        >
                            <div className="font-semibold text-gray-800">{channel.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                                {getChannelTypeLabel(channel.type)}
                            </div>
                            {channel.lastMessage && (
                                <div className="text-xs text-gray-400 mt-1 truncate">
                                    {channel.lastMessage.user.name}: {channel.lastMessage.content.substring(0, 30)}
                                    ...
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Sağ Panel - Mesajlar */}
            <div className="flex-1 flex flex-col">
                {selectedChannel ? (
                    <>
                        {/* Kanal Başlığı */}
                        <div className="bg-white border-b border-gray-200 p-4">
                            <h3 className="text-lg font-semibold text-gray-800">
                                {selectedChannel.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {getChannelTypeLabel(selectedChannel.type)}
                                {selectedChannel.className && ` - ${selectedChannel.className}`}
                            </p>
                        </div>

                        {/* Mesajlar */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                            {messages.length === 0 ? (
                                <div className="text-center text-gray-500 mt-8">
                                    Henüz mesaj yok. İlk mesajı siz gönderin!
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {messages.map((message) => {
                                        const isOwnMessage = message.user.id === userId;
                                        return (
                                            <div
                                                key={message.id}
                                                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                                            >
                                                <div
                                                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                                                        isOwnMessage
                                                            ? "bg-indigo-600 text-white"
                                                            : "bg-white text-gray-800 border border-gray-200"
                                                    }`}
                                                >
                                                    {!isOwnMessage && (
                                                        <div className="text-xs font-semibold mb-1 opacity-80">
                                                            {message.user.name} ({message.user.role})
                                                        </div>
                                                    )}
                                                    <div className="text-sm">{message.content}</div>
                                                    <div
                                                        className={`text-xs mt-1 ${
                                                            isOwnMessage ? "text-indigo-100" : "text-gray-400"
                                                        }`}
                                                    >
                                                        {new Date(message.createdAt).toLocaleTimeString("tr-TR", {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        {/* Mesaj Gönderme */}
                        <div className="bg-white border-t border-gray-200 p-4">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Mesajınızı yazın..."
                                    className="flex-1 rounded-xl border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    disabled={sending}
                                />
                                <button
                                    type="submit"
                                    disabled={sending || !newMessage.trim()}
                                    className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                                >
                                    <Send size={18} />
                                    Gönder
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        Bir kanal seçin
                    </div>
                )}
            </div>
        </div>
    );
}

