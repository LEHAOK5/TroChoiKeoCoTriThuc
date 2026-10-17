function info(tag, message, extra = '') {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] [INFO] [${tag}] ${message}`, extra ? extra : '');
}

function warn(tag, message, extra = '') {
  const ts = new Date().toISOString().slice(11, 19);
  console.warn(`[${ts}] [WARN] [${tag}] ${message}`, extra ? extra : '');
}

function error(tag, message, err = '') {
  const ts = new Date().toISOString().slice(11, 19);
  console.error(`[${ts}] [ERROR] [${tag}] ${message}`, err ? err : '');
}

module.exports = {
  info,
  warn,
  error
};
