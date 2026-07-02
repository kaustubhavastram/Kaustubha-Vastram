import { useState, useEffect, Fragment } from "react";
import { supabase } from "../../lib/supabase";

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all" | "unread" | "read"
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  async function fetchMessages() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleRead(msg) {
    const newValue = !msg.is_read;
    try {
      const { error } = await supabase
        .from("contact_messages")
        .update({ is_read: newValue })
        .eq("id", msg.id);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, is_read: newValue } : m))
      );
    } catch (err) {
      console.error("Failed to update message:", err);
    }
  }

  async function deleteMessage(id) {
    if (!confirm("Delete this message permanently?")) return;
    try {
      const { error } = await supabase
        .from("contact_messages")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  }

  const filtered = messages.filter((m) => {
    if (filter === "unread") return !m.is_read;
    if (filter === "read") return m.is_read;
    return true;
  });

  const unreadCount = messages.filter((m) => !m.is_read).length;

  if (loading) {
    return (
      <div className="admin__content">
        <h1>Messages</h1>
        <div className="admin__loading">Loading messages…</div>
      </div>
    );
  }

  return (
    <div className="admin__content">
      <div className="admin__page-header">
        <h1>
          Messages
          {unreadCount > 0 && (
            <span className="messages__unread-badge">{unreadCount}</span>
          )}
        </h1>
      </div>

      {/* Filters */}
      <div className="admin__toolbar">
        <div className="admin__filters">
          {["all", "unread", "read"].map((f) => (
            <button
              key={f}
              className={`admin__filter-btn${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all"
                ? `All (${messages.length})`
                : f === "unread"
                  ? `Unread (${unreadCount})`
                  : `Read (${messages.length - unreadCount})`}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="admin__empty">
          {filter === "all"
            ? "No contact messages yet."
            : `No ${filter} messages.`}
        </p>
      ) : (
        <table className="admin__table">
          <thead>
            <tr>
              <th style={{ width: "8px" }}></th>
              <th>From</th>
              <th>Subject</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((msg) => (
              <Fragment key={msg.id}>
                <tr
                  className={`messages__row ${!msg.is_read ? "messages__row--unread" : ""} ${expandedId === msg.id ? "admin__row--expanded" : ""}`}
                  onClick={() =>
                    setExpandedId(expandedId === msg.id ? null : msg.id)
                  }
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <span
                      className={`messages__dot ${!msg.is_read ? "messages__dot--unread" : ""}`}
                    />
                  </td>
                  <td>
                    <div className="messages__from">
                      <span className="messages__name">{msg.name}</span>
                      <span className="messages__email">{msg.email}</span>
                    </div>
                  </td>
                  <td>
                    <span className={!msg.is_read ? "messages__subject--unread" : ""}>
                      {msg.subject || "No subject"}
                    </span>
                  </td>
                  <td className="messages__date">
                    {new Date(msg.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    <br />
                    <span className="messages__time">
                      {new Date(msg.created_at).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </td>
                  <td>
                    <div
                      className="admin__actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="admin__action-btn admin__action-btn--edit"
                        onClick={() => toggleRead(msg)}
                        title={msg.is_read ? "Mark as unread" : "Mark as read"}
                      >
                        {msg.is_read ? "Unread" : "Read"}
                      </button>
                      <button
                        className="admin__action-btn admin__action-btn--delete"
                        onClick={() => deleteMessage(msg.id)}
                        title="Delete message"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Expanded message detail */}
                {expandedId === msg.id && (
                  <tr key={`${msg.id}-detail`} className="admin__detail-row">
                    <td colSpan="5">
                      <div className="messages__detail">
                        <div className="messages__detail-header">
                          <div>
                            <strong>{msg.name}</strong>
                            <span className="messages__detail-email">
                              &lt;{msg.email}&gt;
                            </span>
                          </div>
                          <a
                            href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject || "Your message")}`}
                            className="btn btn--outline messages__reply-btn"
                          >
                            ✉ Reply
                          </a>
                        </div>
                        <div className="messages__detail-subject">
                          {msg.subject || "No subject"}
                        </div>
                        <div className="messages__detail-body">
                          {msg.message}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
