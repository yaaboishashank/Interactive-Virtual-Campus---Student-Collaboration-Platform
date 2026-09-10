import { useEffect, useRef, useState } from "react";
import Button from "../../../components/ui/Button/Button";
import useAuth from "../../../hooks/useAuth";
import styles from "../chat.module.css";
import Avatar from "../../profile/components/Avatar";

function typingText(users) {
  if (users.length === 1) {
    return `${users[0].name} is typing…`;
  }

  if (users.length === 2) {
    return `${users[0].name} and ${users[1].name} are typing…`;
  }

  return `${users[0].name} and ${users.length - 1
    } others are typing…`;
}

export default function ChatPanel({ chat }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const listRef = useRef(null);
  const followLatest = useRef(true);

  const currentUserId = String(
    user?._id || user?.id || ""
  );

  const otherTypingUsers = chat.typingUsers.filter(
    (typingUser) =>
      String(typingUser.userId) !== currentUserId
  );

  useEffect(() => {
    const element = listRef.current;

    if (element && followLatest.current) {
      element.scrollTop = element.scrollHeight;
    }
  }, [chat.messages]);


  function handleScroll() {
    const element = listRef.current;

    if (!element) return;

    followLatest.current =
      element.scrollHeight -
      element.scrollTop -
      element.clientHeight <
      100;
  }

  function handleTextChange(event) {
    const value = event.target.value;

    setText(value);
    chat.setTyping(Boolean(value.trim()));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!chat.ready || chat.sending || !text.trim()) {
      return;
    }

    chat.setTyping(false);
    followLatest.current = true;

    if (await chat.sendMessage(text)) {
      setText("");
    }
  }

  return (
    <section className={styles.chat} aria-label="Room chat">
      <header className={styles.chatHeader}>
        <div>
          <h2>Room conversation</h2>
          <span role="status">{chat.status}</span>
        </div>

        {chat.canReconnect && (
          <Button
            type="button"
            onClick={chat.reconnect}
            disabled={chat.sending}
          >
            {chat.accessCode ? "Try again" : "Reconnect"}
          </Button>
        )}
      </header>

      <div
        ref={listRef}
        onScroll={handleScroll}
        className={styles.messages}
        role="log"
        aria-label="Messages"
        aria-live="polite"
        aria-relevant="additions"
        tabIndex={0}
      >
        {chat.ready && chat.messages.length === 0 && (
          <p className={styles.empty}>
            No messages yet. Start the conversation!
          </p>
        )}

        {chat.messages.map((message) => {
          const senderId =
            message.sender?._id || message.sender;

          const own =
            Boolean(currentUserId) &&
            String(senderId) === currentUserId;

          return (
            <article
              key={message._id}
              className={`${styles.message} ${own ? styles.own : ""
                }`}
            >
              <div className={styles.messageMeta}>
                <strong
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <Avatar
                    avatar={own ? user?.avatar : message.sender?.avatar}
                    size={28}
                  />

                  {own
                    ? "You"
                    : message.sender?.name || "Former member"}
                </strong>

                <time dateTime={message.createdAt}>
                  {new Date(
                    message.createdAt
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>

              <p>{message.text}</p>
            </article>
          );
        })}
      </div>

      <p aria-live="polite">
        {otherTypingUsers.length > 0
          ? typingText(otherTypingUsers)
          : "\u00A0"}
      </p>

      {chat.error && (
        <p className={styles.error} role="alert">
          {chat.error}
        </p>
      )}

      <form
        className={styles.composer}
        onSubmit={handleSubmit}
      >
        <label htmlFor="chat-message">Message</label>

        <textarea
          id="chat-message"
          value={text}
          onChange={handleTextChange}
          onBlur={() => chat.setTyping(false)}
          placeholder={
            chat.ready
              ? "Write a message…"
              : "Enter the room to chat"
          }
          maxLength={500}
          rows={2}
          disabled={!chat.ready || chat.sending}
          required
        />

        <div className={styles.composerActions}>
          <small>{text.length}/500</small>

          <Button
            type="submit"
            variant="primary"
            disabled={
              !chat.ready ||
              chat.sending ||
              !text.trim()
            }
          >
            {chat.sending
              ? "Sending…"
              : "Send message"}
          </Button>
        </div>
      </form>
    </section>
  );
}