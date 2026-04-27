const LEVELS = ['debug', 'info', 'warn', 'error'];

const SECRET_KEYS = ['OPENAI_API_KEY', 'SMTP_PASS', 'SMTP_USER'];

export function maskSecrets(text) {
  let out = String(text);
  for (const k of SECRET_KEYS) {
    out = out.replace(new RegExp(`${k}=\\S+`, 'g'), `${k}=****`);
  }
  return out;
}

export function createLogger({ level = 'info', prefix = '', sink } = {}) {
  const minIdx = LEVELS.indexOf(level);
  const emit = sink ?? ((lvl, msg) => {
    const fn = lvl === 'error' ? console.error : console.log;
    fn(`[${new Date().toISOString()}] [${lvl}]${prefix ? ' ' + prefix : ''} ${maskSecrets(msg)}`);
  });
  const make = (lvl) => (msg) => {
    if (LEVELS.indexOf(lvl) >= minIdx) emit(lvl, typeof msg === 'string' ? msg : JSON.stringify(msg));
  };
  return {
    debug: make('debug'),
    info: make('info'),
    warn: make('warn'),
    error: make('error'),
    child: (childPrefix) => createLogger({ level, prefix: `${prefix}${childPrefix}`, sink }),
  };
}
