import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Animated OTP input — crossfade por dígito, cursor piscando, shake em erro,
// colagem do código completo e navegação por teclado (um único input oculto
// detém o valor; as células renderizadas são apenas apresentação).
export function OtpInput({
  length = 6,
  mode = "numeric",
  value = "",
  onChange,
  status = "idle", // idle | error | success
  autoFocus = true,
  hint,
  errorMessage,
  successMessage,
  className = "",
}) {
  const inputRef = useRef(null);
  const [focused, setFocused] = useState(false);
  const digits = (value || "").slice(0, length).split("");
  const activeIndex = Math.min(digits.length, length - 1);

  const handleChange = (raw) => {
    const clean =
      mode === "numeric" ? raw.replace(/\D/g, "") : raw.replace(/[^a-zA-Z0-9]/g, "");
    onChange?.(clean.slice(0, length));
  };

  const cellBorder = (i) => {
    if (status === "error") return "border-destructive";
    if (status === "success") return "border-status-green-fg";
    if (i === activeIndex && focused) return "border-primary";
    return "border-input";
  };

  return (
    <div className={className}>
      <motion.div
        animate={status === "error" ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        className="relative"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex justify-center gap-2">
          {Array.from({ length }).map((_, i) => (
            <div
              key={i}
              className={`flex h-14 w-11 items-center justify-center rounded-xl border-2 bg-card text-center text-xl font-extrabold transition-colors ${cellBorder(i)}`}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {digits[i] ? (
                  <motion.span
                    key={digits[i]}
                    initial={{ opacity: 0, y: 8, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                  >
                    {digits[i]}
                  </motion.span>
                ) : i === activeIndex && focused ? (
                  <motion.span
                    key="cursor"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [1, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 0.9, repeatType: "reverse" }}
                    className="h-6 w-0.5 rounded bg-primary"
                  />
                ) : null}
              </AnimatePresence>
            </div>
          ))}
        </div>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoFocus={autoFocus}
          autoComplete="one-time-code"
          inputMode={mode === "numeric" ? "numeric" : "text"}
          className="absolute inset-0 h-full w-full cursor-text opacity-0"
          aria-label="Código de verificação"
        />
      </motion.div>

      <div className="mt-3 min-h-[18px] text-center text-body-sm">
        <AnimatePresence mode="wait" initial={false}>
          {status === "error" && errorMessage ? (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="font-semibold text-destructive"
            >
              {errorMessage}
            </motion.p>
          ) : status === "success" && successMessage ? (
            <motion.p
              key="success"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="font-semibold text-status-green-fg"
            >
              {successMessage}
            </motion.p>
          ) : hint ? (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-muted-foreground"
            >
              {hint}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default OtpInput;